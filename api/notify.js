// Простой API сервер для отправки уведомлений
// В продакшене лучше использовать Supabase Edge Functions или отдельный сервер

const BOT_TOKEN = process.env.BOT_TOKEN || '8210216557:AAFeNn2-EW1nnbL-Ahyk3f1dpq3JjrlniCI'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { chatId, message, parseMode = 'HTML' } = req.body

  if (!chatId || !message) {
    return res.status(400).json({ error: 'Missing chatId or message' })
  }

  try {
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

    const data = await response.json()
    res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('Error sending notification:', error)
    res.status(500).json({ error: 'Failed to send notification' })
  }
}
