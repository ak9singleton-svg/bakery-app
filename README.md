# 🍰 Bakery App - Приложение для кондитерской

Современное приложение для кондитерской с админ-панелью, интегрированное с Telegram WebApp.

## ✨ Возможности

### Для клиентов:
- 🛒 Каталог товаров с мультиязычностью (русский/казахский)
- 🛍️ Корзина покупок
- 📱 История заказов
- 💳 Интеграция с Kaspi для оплаты
- 🔔 Уведомления о статусе заказа

### Для администраторов:
- 📊 Управление товарами (добавление, редактирование, удаление)
- 📋 Управление заказами (просмотр, изменение статуса)
- ⚙️ Настройки магазина
- 🔐 Безопасная авторизация через Telegram

## 🚀 Технологии

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Auth**: Telegram WebApp
- **Deploy**: Vercel/Netlify

## 📦 Установка

1. **Клонируйте репозиторий:**
```bash
git clone https://github.com/ak9singleton-svg/bakery-app.git
cd bakery-app
```

2. **Установите зависимости:**
```bash
npm install
```

3. **Настройте переменные окружения:**
```bash
cp .env.example .env
```

Заполните `.env` файл:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_ID=your_telegram_admin_id
BOT_TOKEN=your_telegram_bot_token
```

4. **Запустите в режиме разработки:**
```bash
npm run dev
```

## 🗄️ Настройка Supabase

### 1. Создайте таблицы:

```sql
-- Таблица товаров
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  name_kk TEXT,
  description TEXT,
  description_kk TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  category_kk TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица заказов
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  date TIMESTAMP DEFAULT NOW(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_comment TEXT,
  telegram_user_id BIGINT,
  telegram_username TEXT,
  telegram_first_name TEXT,
  telegram_last_name TEXT,
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'processing', 'completed', 'cancelled'))
);

-- Таблица настроек
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  shop_name TEXT DEFAULT 'Наша Кондитерская',
  shop_phone TEXT,
  shop_logo TEXT,
  kaspi_phone TEXT,
  kaspi_link TEXT,
  payment_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Настройте RLS (Row Level Security):

```sql
-- Включите RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Политики для товаров (все могут читать)
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);

-- Политики для заказов (пользователи видят только свои заказы)
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (
  auth.uid()::text = telegram_user_id::text
);

-- Политики для настроек (все могут читать)
CREATE POLICY "Settings are viewable by everyone" ON settings FOR SELECT USING (true);
```

## 🤖 Настройка Telegram Bot

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Получите токен бота
3. Создайте WebApp через [@BotFather](https://t.me/BotFather):
   - `/newapp`
   - Выберите вашего бота
   - Укажите URL вашего приложения
   - Загрузите иконку и описание

## 🚀 Деплой

### Vercel (рекомендуется):

1. Подключите репозиторий к Vercel
2. Добавьте переменные окружения в настройках Vercel
3. Деплой автоматически запустится

### Netlify:

1. Подключите репозиторий к Netlify
2. Настройте переменные окружения
3. Деплой автоматически запустится

## 📱 Использование

### Для клиентов:
1. Откройте приложение через Telegram WebApp
2. Выберите товары и добавьте в корзину
3. Оформите заказ
4. Получите уведомления о статусе заказа

### Для администраторов:
1. Откройте приложение через Telegram (только для админов)
2. Управляйте товарами в разделе "Товары"
3. Обрабатывайте заказы в разделе "Заказы"
4. Настройте магазин в разделе "Настройки"

## 🔒 Безопасность

- ✅ Токены бота скрыты в переменных окружения
- ✅ RLS политики защищают данные
- ✅ Админ-доступ только для авторизованных пользователей
- ✅ Валидация данных на клиенте и сервере

## 📄 Лицензия

MIT License

## 🤝 Поддержка

Если у вас есть вопросы или предложения, создайте issue в репозитории.