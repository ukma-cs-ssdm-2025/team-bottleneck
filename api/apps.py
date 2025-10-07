import os
from django.apps import AppConfig
from drf_spectacular.generators import SchemaGenerator
import yaml
import json

class ApiConfig(AppConfig): # створення файлу автодокументації
    name = 'api'

    def ready(self):
        os.makedirs('docs/api/', exist_ok=True)
        generator = SchemaGenerator()
        new_schema = generator.get_schema(request=None, public=True)
        file_path = 'docs/api/openapi-generated.yaml'

        # Якщо файл існує, зчитуємо поточну схему
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                try:
                    old_schema = yaml.safe_load(f)
                    # Перетворюємо в JSON для порівняння (щоб уникнути проблем із форматуванням YAML)
                    new_schema_json = json.dumps(new_schema, sort_keys=True)
                    old_schema_json = json.dumps(old_schema, sort_keys=True)
                    if new_schema_json != old_schema_json:
                        with open(file_path, 'w') as f:
                            yaml.dump(new_schema, f)
                except Exception:
                    # У разі помилки (наприклад, пошкоджений файл) перезаписуємо
                    with open(file_path, 'w') as f:
                        yaml.dump(new_schema, f)
        else:
            # Якщо файлу немає, створюємо новий
            with open(file_path, 'w') as f:
                yaml.dump(new_schema, f)