# Настройка Email для восстановления пароля

## В режиме разработки

По умолчанию в режиме разработки email не отправляется реально, а только логируется в консоль. Это позволяет тестировать функционал без настройки реального email.

## Настройка Gmail для продакшн

Для работы с Gmail нужно:

### 1. Создать .env файл в папке backend:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ichggram
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRES_IN=7d

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

CLIENT_URL=http://localhost:3000
RESET_TOKEN_EXPIRES=15m
```

### 2. Настроить Gmail App Password:

1. Войдите в свой Google Account
2. Перейдите в "Security" (Безопасность)
3. Включите "2-Step Verification" (Двухфакторная аутентификация)
4. В разделе "2-Step Verification" найдите "App passwords"
5. Создайте новый App Password для "Mail"
6. Используйте этот 16-символьный пароль в EMAIL_PASS

### 3. Альтернативные провайдеры:

Можно использовать другие email провайдеры:

**Outlook/Hotmail:**
```javascript
service: 'hotmail'
```

**Yahoo:**
```javascript
service: 'yahoo'
```

**Пользовательский SMTP:**
```javascript
host: 'smtp.your-provider.com',
port: 587,
secure: false,
auth: {
  user: 'your-email@domain.com',
  pass: 'your-password'
}
```

## Тестирование

В режиме разработки без настроенного email:
- Функция восстановления пароля работает
- Email логируется в консоль сервера
- Токен сброса создается и сохраняется в БД
- Можно использовать токен для сброса пароля

## Проверка работы

1. Запустите сервер: `npm run dev`
2. Попробуйте восстановить пароль
3. Проверьте консоль сервера - там должен появиться лог с содержимым email
4. Скопируйте ссылку из лога и используйте для сброса пароля 