# Компонентна діаграма (Component Diagram)

## Опис

Компонентна діаграма показує основні компоненти системи управління паркінгом та їх взаємодію.

## Діаграма

![Component Diagram](uml/diagrams_png/component_diagram.png)

## Вихідний код

[component_diagram.puml](component_diagram.puml)

## Компоненти системи

### Presentation Layer
- **Web/Mobile UI** - інтерфейс користувача

### Application Layer
- **Authentication Service** - сервіс автентифікації
- **Parking Management Service** - управління паркінгом
- **Payment Service** - обробка платежів
- **Notification Service** - сповіщення користувачів

### Data Layer
- **DAO** - Data Access Object для роботи з базою даних
- **PostgreSQL DB** - реляційна база даних

### External Systems
- **Payment Gateway** - платіжний шлюз
- **Email/SMS Provider** - провайдер для відправки повідомлень
