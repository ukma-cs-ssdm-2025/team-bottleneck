# Діаграма розгортання (Deployment Diagram)

## Опис

Діаграма розгортання ілюструє фізичну архітектуру системи управління паркінгом та розподіл компонентів по серверах.

## Діаграма

![Deployment Diagram](uml/diagrams_png/deployment_diagram.png)

## Вихідний код

[deployment_diagram.puml](deployment_diagram.puml)

## Вузли системи

### Client Device
- **Web Browser (React UI)** - клієнтський інтерфейс на React

### Application Server
- **REST API** - RESTful API для комунікації
- **Python App (Бізнес-логіка)** - серверна логіка на Python

### Database Server
- **PostgreSQL** - база даних для зберігання інформації

### External Services
- **Payment System** - зовнішня платіжна система
- **Email/SMS Provider** - сервіс для відправки повідомлень

## Потік даних

1. Користувач взаємодіє з веб-браузером
2. Браузер відправляє запити до REST API
3. REST API передає запити до Python-застосунку
4. Python-застосунок взаємодіє з:
   - PostgreSQL для роботи з даними
   - Payment System для обробки платежів
   - Email/SMS Provider для відправки сповіщень
