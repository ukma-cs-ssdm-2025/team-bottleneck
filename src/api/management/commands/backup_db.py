import os
import subprocess
import boto3
import tempfile
from datetime import datetime
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from src.api.models import BackupLog

class Command(BaseCommand):
    help = 'Backs up the RDS database and uploads to S3'

    def handle(self, *args, **options):
        BUCKET_NAME = "smart-parking-backups-storage"  
        S3_FOLDER = "daily_backups"            

        db_conf = settings.DATABASES['default']
        db_name = db_conf['NAME']
        db_user = db_conf['USER']
        db_password = db_conf['PASSWORD']
        db_host = db_conf['HOST']
        db_port = db_conf['PORT']

        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        filename = f"{db_name}-{timestamp}.sql.gz"
        temp_dir = tempfile.gettempdir()
        local_path = Path(temp_dir) / filename
        s3_key = f"{S3_FOLDER}/{filename}"

        self.stdout.write(f"Starting backup for {db_name}...")
        self.stdout.write(f"Temp file path: {local_path}")

        env = os.environ.copy()
        env['PGPASSWORD'] = str(db_password)

        dump_cmd = [
            'pg_dump',
            '-h', db_host,
            '-p', str(db_port),
            '-U', db_user,
            db_name
        ]

        try:
            with open(local_path, 'wb') as f:
                p1 = subprocess.Popen(dump_cmd, stdout=subprocess.PIPE, env=env)
                p2 = subprocess.Popen(['gzip'], stdin=p1.stdout, stdout=f)
                p1.stdout.close()
                p2.communicate()

            if p2.returncode != 0:
                raise Exception(f"pg_dump failed. Return code: {p2.returncode}")

            self.stdout.write(self.style.SUCCESS(f"Dump created at {local_path} size: {local_path.stat().st_size} bytes"))

            s3 = boto3.client('s3', region_name='eu-north-1')
            
            s3.upload_file(str(local_path), BUCKET_NAME, s3_key)
            success_msg=f"Successfully uploaded to s3://{BUCKET_NAME}/{s3_key}"
            self.stdout.write(self.style.SUCCESS(success_msg))

            os.remove(local_path)
            self.stdout.write("Local cleanup done.")

            BackupLog.objects.create(
                status='SUCCESS',
                message=success_msg
            )

        except Exception as e:
            error_msg=f"Error: {str(e)}"
            self.stdout.write(self.style.ERROR(error_msg))

            BackupLog.objects.create(
                status='FAILURE',
                message=error_msg
            )