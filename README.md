[![Deploy to EC2](https://github.com/ukma-cs-ssdm-2025/team-bottleneck/actions/workflows/DeployToEC2.yml/badge.svg)](https://github.com/ukma-cs-ssdm-2025/team-bottleneck/actions/workflows/DeployToEC2.yml)
![Coverage](https://ukma-cs-ssdm-2025.github.io/team-bottleneck/coverage.svg)

# Team Project: Smart Parking

This project is developed for educational purposes as part of the course "Software Systems Development Methods." The goal is to create a smart parking booking and payment system for drivers that tracks spot availability.

## Team Members

* Anastasia (GitHub: [@anastasiaaq](https://github.com/anastasiaaq))
* Valentina (GitHub: [@valuuusha](https://github.com/valuuusha))
* Anton (GitHub: [@MaFiN1337](https://github.com/MaFiN1337))
* Victoria (GitHub: [@Victoria7778](https://github.com/Victoria7778))

## Repository Structure

* [Project-Description.md](Project-Description.md) -- project description
* [TeamCharter.md](TeamCharter.md) -- team charter

## Requirements Artifacts

* [requirements.md](docs/requirements/requirements.md) -- functional and non-functional requirements
* [user-stories.md](docs/requirements/user-stories.md) -- user stories
* [use-cases.md](docs/requirements/use-cases.md) -- use cases
* [rtm.md](docs/requirements/rtm.md) -- rtm.md
  
## Project Architecture

* [high-level-diagram.png](docs/architecture/high-level-diagram.png) -- high-level architecture diagram
* [high-level-design.md](docs/architecture/high-level-design.md) -- high-level design description
* [traceability-matrix.md](docs/architecture/traceability-matrix.md) -- mapping requirements to architecture
* [architecture](docs/architecture/) -- folder with all architecture files

## API Documentation

* [api-design.md](docs/api/api-design.md) – documentation of API design decisions
* [quality-attributes.md](docs/api/quality-attributes.md) – API Quality Attributes
* [api](docs/api) - other files related to api documentation

## Code Quality

* [progress.md](docs/code-quality/progress.md) – file showing project progress
* [code-quality](docs/code-quality) – other files related to code quality

## Testing Documentation

* [debugging-log.md](docs/testing/debugging-log.md) – debugging log
* [testing-strategy.md](docs/testing/testing-strategy.md) – testing strategy

## Validation Documentation
* [review_log.md](docs/validation/review_log.md) – Review of the Rate UKMA Test Plan
* [test-plan.md](docs/validation/test-plan.md) – test plan overview

## Refactoring Documentation
* [sonarcloud-report.md](docs/refactoring/sonarcloud-report.md) – sonarcloud-report

## Reliability Documentation
* [reliability-report.md](docs/reliability/reliability-report.md) – reliability-report
* [scavenger-hunt.md](docs/reliability/scavenger-hunt.md) – scavenger-hunt

## CI-CD Documentation
* [dora-summary.md](docs/ci-cd/dora-summary.md) – dora-summary

  

## Local Deployment Instructions

### Requirements:

* git pull `https://github.com/ukma-cs-ssdm-2025/team-bottleneck.git`
* Create a `.env` file and populate it:

```
DJANGO_SECRET_KEY=Your-generated-django-key
DJANGO_DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1

RDS_DB_NAME=postgres
RDS_USERNAME=MaFiN
RDS_PASSWORD=your-db-password
RDS_HOSTNAME=127.0.0.1
RDS_PORT=5433
STRIPE_PUBLIC_KEY=pk_test_your_public_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_CURRENCY=your_currency_example_uah

STATIC_ROOT=
MEDIA_ROOT=
```

#### Connecting to the DB (first terminal)

* ssh -i "Absolute path to .pem key" -N -L 5433:smart-parking-db.cz26seqes6xp.eu-north-1.rds.amazonaws.com:5432 ubuntu@13.61.159.130

#### Running Django backend (second terminal)

* pip install -r requirements.txt
* python manage.py makemigrations api
* python manage.py migrate
* python manage.py runserver

*[http://127.0.0.1:8000](http://127.0.0.1:8000) - backend URL (/api/docs for Swagger UI)*

#### Running React frontend (third terminal)

##### Prerequisites:

* Node.js installed, if not:

  * Visit [node.js](https://nodejs.org/uk/download) and download Node.js v22.21.0 (npm 10.x.x installs automatically)
  * Add Node.js to PATH (Example: C:\Program Files\nodejs)

##### Instructions:

* cd frontend
* npm install
* npm start

*localhost:3000 - URL of the locally running website*

## Github Pages

* [Swagger UI](https://ukma-cs-ssdm-2025.github.io/team-bottleneck/)
* [Coverage](https://ukma-cs-ssdm-2025.github.io/team-bottleneck/htmlcov/)

