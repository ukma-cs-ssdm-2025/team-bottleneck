# Bandit Static Analysis Report

**Run started:** 2025-10-12 09:46:13.628316  

---

## Test Results

> **Issue:** [B105:hardcoded_password_string]  
> **Description:** Possible hardcoded password detected:  
> `'django-insecure-eu8i0&87l%-25hpe+j1uw=+v1gx14xk16@^6q!==qec)9oaa$y'`  
> **Severity:** Low  
> **Confidence:** Medium  
> **CWE:** [CWE-259](https://cwe.mitre.org/data/definitions/259.html)  
> **More Info:** [Bandit B105 Documentation](https://bandit.readthedocs.io/en/1.8.6/plugins/b105_hardcoded_password_string.html)  
> **Location:** `.\delivery-service\app\settings.py:23:13`

```python
22  # SECURITY WARNING: keep the secret key used in production secret!
23  SECRET_KEY = 'django-insecure-eu8i0&87l%-25hpe+j1uw=+v1gx14xk16@^6q!==qec)9oaa$y'
24
```

# Flake8 Static Analysis Report

**Run started:** 2025-10-9 

### Code Style Violations (PEP8)

- **Mixed indentation:** Multiple occurrences of **tabs and spaces** used together — can cause `IndentationError`.  
  - Example: `settings.py`, `urls.py`, `views/api/dishes.py`  

- **Line length exceeded:** Several lines longer than **79 characters** (`E501`).  
  - Found in `settings.py`, `urls.py`, `test_dishes_api.py`  

- **Unused imports (`F401`):**  
  - `django.contrib.admin`, `django.db.models`, `django.test.TestCase`, `django.shortcuts.render`, `django.urls.path`  
  - Present across several files (`admin.py`, `models.py`, `tests.py`, `views.py`, `urls/web.py`)  

- **Star imports (`F403` / `F405`):**  
  - `from restaurant.services.dishes import *` used — makes it unclear which functions are imported.  
  - Causes undefined reference warnings (`get_all_dishes`, `create_dish`, etc.).  

- **Trailing and blank lines:**  
  - Extra blank lines at file ends (`W391`) and missing newlines (`W292`).  
  - Found in multiple files under `tests/` and `urls/`.  

- **Missing blank lines between functions (`E302`):**  
  - Functions not properly separated, reducing readability.  

## Overall Assessment

- **Code formatting issues** dominate the report — primarily indentation inconsistencies and unused imports.  
- Applying `black` or `autopep8` would automatically fix **80–90%** of issues.  
- No high-severity syntax or logic errors detected.  

## Recommendation

- Use **consistent indentation (4 spaces, no tabs)**.  
- Remove **unused imports** and **avoid wildcard imports**.  
- Run `flake8 --max-line-length=88` and **auto-format** using:  
  ```bash
  black .
