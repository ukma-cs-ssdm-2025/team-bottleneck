[![Deploy to EC2](https://github.com/ukma-cs-ssdm-2025/team-bottleneck/actions/workflows/DeployToEC2.yml/badge.svg)](https://github.com/ukma-cs-ssdm-2025/team-bottleneck/actions/workflows/DeployToEC2.yml)
[![Tests Coverage](coverage.svg)](https://github.com/ukma-cs-ssdm-2025/team-bottleneck/actions/workflows/RunUnitTests.yml)
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

## Інструкція запуску (локальне розгортання)
### Для запуску потрібно:
- git pull `https://github.com/ukma-cs-ssdm-2025/team-bottleneck.git`
- Створити .env і наповнити:
```
DJANGO_SECRET_KEY=Ваш-згенерований-код-для-django
DJANGO_DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1

RDS_DB_NAME=postgres
RDS_USERNAME=MaFiN
RDS_PASSWORD=пароль-до-БД
RDS_HOSTNAME=127.0.0.1
RDS_PORT=5433
STRIPE_PUBLIC_KEY=pk_test_публічний_ключ
STRIPE_SECRET_KEY=sk_test_секретний_ключ
STRIPE_CURRENCY=ваша_валюта_наприклад_uah

STATIC_ROOT=
MEDIA_ROOT=
```
#### Підключення до БД(перший термінал)
- ssh -i "Absolute path to .pem key" -N -L 5433:smart-parking-db.cz26seqes6xp.eu-north-1.rds.amazonaws.com:5432 ubuntu@16.170.148.253

#### Запуск django-бекенду(Другий термінал)
- pip install -r requirements.txt
- python manage.py makemigrations api
- python manage.py migrate
- python manage.py runserver

*[http://127.0.0.1:8000](http://127.0.0.1:8000) - адреса бекенду (/api/docs для swagger UI)*

#### Запуск react-фронтенду(Третій термінал)
##### Prerequisites:
- Встановлено node.js, якщо ні:
  - Відвідайте сайт [node.js](https://nodejs.org/uk/download) та скачайте node.js v22.21.0 (npm автоматично має завантажитись 10.х.х версії)
  - Додайте node.js в PATH (Приклад: C:\Program Files\nodejs)
##### Instructions:
- cd frontend
- npm install
- npm start

*localhost:3000 - адреса локально розгорнутого вебсайту*

## Github Pages
- [Посилання на GitHub Pages](https://ukma-cs-ssdm-2025.github.io/team-bottleneck/)

