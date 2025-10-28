// Утилиты для работы с Telegram WebApp

export const initTelegramWebApp = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp
    tg.ready()
    tg.expand()
    return tg
  }
  return null
}

export const getTelegramUser = () => {
  const tg = initTelegramWebApp()
  return tg?.initDataUnsafe?.user || null
}

export const getTelegramInitData = () => {
  const tg = initTelegramWebApp()
  return tg?.initData || null
}

export const showTelegramBackButton = (onClick) => {
  const tg = initTelegramWebApp()
  if (tg?.BackButton) {
    tg.BackButton.onClick(onClick)
    tg.BackButton.show()
  }
}

export const hideTelegramBackButton = () => {
  const tg = initTelegramWebApp()
  if (tg?.BackButton) {
    tg.BackButton.hide()
  }
}

export const showTelegramMainButton = (text, onClick) => {
  const tg = initTelegramWebApp()
  if (tg?.MainButton) {
    tg.MainButton.setText(text)
    tg.MainButton.onClick(onClick)
    tg.MainButton.show()
  }
}

export const hideTelegramMainButton = () => {
  const tg = initTelegramWebApp()
  if (tg?.MainButton) {
    tg.MainButton.hide()
  }
}

export const showTelegramAlert = (message) => {
  const tg = initTelegramWebApp()
  if (tg?.showAlert) {
    tg.showAlert(message)
  } else {
    alert(message)
  }
}

export const showTelegramConfirm = (message, callback) => {
  const tg = initTelegramWebApp()
  if (tg?.showConfirm) {
    tg.showConfirm(message, callback)
  } else {
    const result = confirm(message)
    callback(result)
  }
}
