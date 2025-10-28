import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Получение пользователя Telegram
export const getTelegramUser = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp.initDataUnsafe?.user || null
  }
  return null
}

// Проверка, является ли пользователь админом
export const isAdmin = (telegramUser) => {
  const adminId = import.meta.env.VITE_ADMIN_ID
  return telegramUser?.id?.toString() === adminId?.toString()
}

// Отправка уведомлений напрямую (только для разработки)
// В продакшене нужно использовать Supabase Edge Functions
export const sendNotification = async (chatId, message, parseMode = 'HTML') => {
  try {
    const BOT_TOKEN = import.meta.env.VITE_BOT_TOKEN || '8256833464:AAHBzZdX9zRIlxSysqTgoMxdkrzux9vbzNk'
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: parseMode
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Telegram API error: ${errorData.description}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending notification:', error)
    throw error
  }
}
