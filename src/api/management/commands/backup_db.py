import os
import subprocess
import boto3
from datetime import datetime
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings

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
        local_path = Path(f"/tmp/{filename}")
        s3_key = f"{S3_FOLDER}/{filename}"

        self.stdout.write(f"Starting backup for {db_name}...")

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
                output, error = p2.communicate()

            if p2.returncode != 0:
                raise Exception(f"pg_dump failed. Return code: {p2.returncode}")

            self.stdout.write(self.style.SUCCESS(f"Dump created at {local_path} size: {local_path.stat().st_size} bytes"))

            s3 = boto3.client('s3', region_name='eu-north-1')
            
            s3.upload_file(str(local_path), BUCKET_NAME, s3_key)
            self.stdout.write(self.style.SUCCESS(f"Successfully uploaded to s3://{BUCKET_NAME}/{s3_key}"))

            os.remove(local_path)
            self.stdout.write("Local cleanup done.")

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error: {str(e)}"))
            if local_path.exists():
                os.remove(local_path)