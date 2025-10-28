import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Проверка, является ли пользователь админом
export const isAdmin = (telegramUser) => {
  const adminId = import.meta.env.VITE_ADMIN_ID
  return telegramUser?.id?.toString() === adminId?.toString()
}

// Безопасная отправка уведомлений через серверную функцию
export const sendNotification = async (chatId, message, parseMode = 'HTML') => {
  try {
    const response = await fetch('/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId,
        message,
        parseMode
      })
    })

    if (!response.ok) {
      throw new Error('Failed to send notification')
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending notification:', error)
    throw error
  }
}
