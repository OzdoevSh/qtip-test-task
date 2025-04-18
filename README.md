# Тестовое задание QTIP

## Инструкция по запуску:
### Требования
Для установки и запуска проекта, необходим [NodeJS](https://nodejs.org/) v20+.

### Установка зависимостей
Для установки зависимостей, выполните команду:
```sh
npm i
```

### Инициализация БД
Чтобы инциализировать БД, выполните команду:
```sh
npm run migration:run
```

### Запуск проекта
Чтобы запустить проект, выполните команду:
```sh
npm run start:dev
```

### Проверка линтером
Чтобы запустить проверку линтером, выполните команду:
```sh
npm run lint
```


## Маршруты API:
### Регистрация нового пользователя
POST /auth/register
#### Запрос:
```sh
curl -X POST http://localhost:3000/auth/register \
-H "Content-Type: application/json" \
-d '{"username":"User1","password":"password123"}'
```
#### Ответ:
```sh
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Вход зарегистрированного пользователя
POST /auth/login
#### Запрос:
```sh
curl -X POST http://localhost:3000/auth/login \
-H "Content-Type: application/json" \
-d '{"username":"User1","password":"password123"}'
```
#### Ответ:
```sh
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Получение списка статей (c филтрацией по автору, дате публикации и пагинацией)
GET /articles
#### Запрос:
```sh
curl -X GET http://localhost:3000/articles?author=1&startDate=2025-04-16&endDate=2025-04-19&page=2 \
-H "Content-Type: application/json" \
```
#### Ответ:
```sh
{
  "data": [
    {
      "id": 1,
      "title": "Статья",
      "description": "Описание",
      ...
    },
    ...
  ],
  "total": 16,
  "page": 1,
  "last_page": 2
}
```

### Просмотр отдельной статьи
GET /articles/{id}
#### Запрос:
```sh
curl -X GET http://localhost:3000/articles/1 \
-H "Content-Type: application/json" \
```
#### Ответ:
```sh
{
  "id": 1,
  "title": "Статья",
  "description": "Описание",
  ...
}
```

### Создание статьи
POST /articles
#### Запрос:
```sh
curl -X POST http://localhost:3000/articles \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
-d '{ "title": "Новая статья", "descrition": "Новое описание" }'
```
#### Ответ:
```sh
{
  "id": 2,
  "title": "Новая статья",
  "description": "Новое описание",
  ...
}
```

### Редактирование статьи
PATCH /articles/2
#### Запрос:
```sh
curl -X PATCH http://localhost:3000/articles/2 \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
-d '{ "title": "Редактированная статья", "descrition": "Редактированное описание" }'
```
#### Ответ:
```sh
{
  "id": 2,
  "title": "Редактированная статья",
  "description": "Редактированное описание",
  ...
}
```

### Удаление статьи
DELETE /articles/2
#### Запрос:
```sh
curl -X DELETE http://localhost:3000/articles/2 \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
-d '{ "title": "Редактированная статья", "descrition": "Редактированное описание" }'
```
#### Ответ:
```sh
{
  "id": 2,
  "title": "Редактированная статья",
  "description": "Редактированное описание",
  ...
}
```