[![GitHub Actions Demo](https://github.com/ukma-cs-ssdm-2025/team-bottleneck/actions/workflows/github-actions-demo.yml/badge.svg?event=push)](https://github.com/ukma-cs-ssdm-2025/team-bottleneck/actions/workflows/github-actions-demo.yml) [![Deploy to EC2](https://github.com/ukma-cs-ssdm-2025/team-bottleneck/actions/workflows/DeployToEC2.yml/badge.svg)](https://github.com/ukma-cs-ssdm-2025/team-bottleneck/actions/workflows/DeployToEC2.yml)

# Командний проект: Smart Parking

Цей проект виконується в навчальних цілях в рамках курсу "Методи розробки програмних систем". Мета проекту — розробити систему розумного бронювання та оплати парковок для водіїв, що відстежує доступність місць.

## Учасники
- Анастасія (GitHub: [@anastasiaaq](https://github.com/anastasiaaq))
- Валентина (GitHub: [@valuuusha](https://github.com/valuuusha))
- Антон (GitHub: [@MaFiN1337](https://github.com/MaFiN1337))
- Вікторія (GitHub: [@Victoria7778](https://github.com/Victoria7778))

## Структура репозиторію
- [Project-Description.md](Project-Description.md) -- опис проекту
- [TeamCharter.md](TeamCharter.md) -- командний статут

## Артефакти вимог
- [requirements.md](docs/requirements/requirements.md) -- функціональні та нефункціональні вимоги
- [user-stories.md](docs/requirements/user-stories.md) -- користувацькі історії
- [use-cases.md](docs/requirements/rtm.md) -- use cases
  
## Архітектура проекту
- [high-level-diagram.png](docs/architecture/high-level-diagram.png) -- діаграма архітектурного огляду
- [high-level-design.md](docs/architecture/high-level-design.md) -- опис high-level-design
- [traceability-matrix.md](docs/architecture/traceability-matrix.md) - відповідність вимог архітектурі
- [architecture](docs/architecture/) -- папка з усіма файлами архітектури проекту

## Інструкція запуску
### Для запуску потрібно:
- pip install -r requirements.txt
- python manage.py makemigrations api
- python manage.py migrate

- **python manage.py runserver**

- Після цього перейти за адресою http://127.0.0.1:8000/
