import { useState, useEffect } from 'react'
import { getTelegramUser, isAdmin } from './services/supabase'
import Shop from './pages/Shop'
import Admin from './pages/Admin'

function App() {
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Проверяем, является ли пользователь админом
    const user = getTelegramUser()
    if (user && isAdmin(user)) {
      setIsAdminMode(true)
    }
    
    // Для тестирования: показываем админку если есть параметр ?admin=true
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('admin') === 'true') {
      setIsAdminMode(true)
    }
    
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return isAdminMode ? <Admin /> : <Shop />
}

export default App