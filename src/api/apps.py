import os
from django.apps import AppConfig
import yaml
import json

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'src.api'

    def ready(self):
        from drf_spectacular.generators import SchemaGenerator
        os.makedirs('docs/api/', exist_ok=True)
        generator = SchemaGenerator()
        new_schema = generator.get_schema(request=None, public=True)
        file_path = 'docs/api/openapi-generated.yaml'

        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                try:
                    old_schema = yaml.safe_load(f)
                    # Convert to JSON for comparison (to avoid YAML formatting issues)
                    new_schema_json = json.dumps(new_schema, sort_keys=True)
                    old_schema_json = json.dumps(old_schema, sort_keys=True)
                    if new_schema_json != old_schema_json:
                        with open(file_path, 'w') as f:
                            yaml.dump(new_schema, f)
                except Exception:
                    # In case of an error (for example, a corrupted file), overwrite it
                    with open(file_path, 'w') as f:
                        yaml.dump(new_schema, f)
        else:
            # If the file doesn’t exist, create a new one
            with open(file_path, 'w') as f:
                yaml.dump(new_schema, f)
