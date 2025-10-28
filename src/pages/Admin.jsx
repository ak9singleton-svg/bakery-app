import { useState, useEffect } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useOrders } from '../hooks/useOrders'
import { useSettings } from '../hooks/useSettings'
import { sendNotification } from '../services/supabase'
import { isAdmin, getTelegramUser } from '../services/supabase'
import { getTranslation } from '../utils/translations'
import { EditIcon, DeleteIcon } from '../components/icons'

const Admin = () => {
  const [activeTab, setActiveTab] = useState('products')
  const [editingProduct, setEditingProduct] = useState(null)
  const [showProductForm, setShowProductForm] = useState(false)
  const [productForm, setProductForm] = useState({
    name: '', 
    name_kk: '', 
    description: '', 
    description_kk: '',
    price: '', 
    category: '', 
    category_kk: '',
    image: ''
  })
  const [telegramUser, setTelegramUser] = useState(null)
  const [isAuthorized, setIsAuthorized] = useState(false)

  const { products, loading: productsLoading, addProduct, updateProduct, deleteProduct } = useProducts()
  const { orders, updateOrderStatus } = useOrders()
  const { settings, saveSettings } = useSettings()

  const t = (key) => getTranslation('ru', key) // Админка всегда на русском

  // Проверка авторизации
  useEffect(() => {
    const user = getTelegramUser()
    if (user) {
      setTelegramUser(user)
      if (isAdmin(user)) {
        setIsAuthorized(true)
      } else {
        alert('У вас нет доступа к админ-панели')
        window.close()
      }
    } else {
      alert('Необходимо открыть приложение через Telegram')
      window.close()
    }
  }, [])

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price || !productForm.category) {
      alert('Заполните обязательные поля (RU): название, цена, категория')
      return
    }
    
    const productData = {
      name: productForm.name,
      name_kk: productForm.name_kk || productForm.name,
      description: productForm.description,
      description_kk: productForm.description_kk || productForm.description,
      price: parseFloat(productForm.price),
      category: productForm.category,
      category_kk: productForm.category_kk || productForm.category,
      image: productForm.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400'
    }

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData)
      } else {
        await addProduct(productData)
      }
      resetForm()
    } catch (error) {
      console.error('Ошибка сохранения товара:', error)
      alert('Ошибка сохранения товара')
    }
  }

  const handleDeleteProduct = async (id) => {
    if (confirm('Удалить этот товар?')) {
      try {
        await deleteProduct(id)
      } catch (error) {
        console.error('Ошибка удаления товара:', error)
        alert('Ошибка удаления товара')
      }
    }
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      name_kk: product.name_kk || '',
      description: product.description,
      description_kk: product.description_kk || '',
      price: product.price.toString(),
      category: product.category,
      category_kk: product.category_kk || '',
      image: product.image
    })
    setShowProductForm(true)
  }

  const resetForm = () => {
    setProductForm({ 
      name: '', 
      name_kk: '', 
      description: '', 
      description_kk: '',
      price: '', 
      category: '', 
      category_kk: '',
      image: '' 
    })
    setEditingProduct(null)
    setShowProductForm(false)
  }

  const sendStatusNotification = async (order, newStatus) => {
    if (!order.telegram_user_id) return

    try {
      let message = ''
      
      switch (newStatus) {
        case 'processing':
          message = `⏳ <b>Ваш заказ принят в работу! / Тапсырысыңыз орындалуда!</b>\n\n`
          message += `📋 Заказ / Тапсырыс #${order.id.slice(-6)}\n`
          message += `Мы начали готовить ваш заказ. Скоро он будет готов! 👨‍🍳\n`
          message += `Тапсырысыңызды дайындауды бастадық. Жақында дайын болады!`
          break
          
        case 'completed':
          message = `🎉 <b>Ваш заказ готов! / Тапсырысыңыз дайын!</b>\n\n`
          message += `📋 Заказ / Тапсырыс #${order.id.slice(-6)}\n`
          message += `Можете забирать или ожидайте курьера! 🚗\n`
          message += `Алып кетуге болады немесе курьерді күтіңіз!\n\n`
          message += `Спасибо за заказ! / Тапсырысыңызға рахмет! ❤️`
          break
          
        case 'cancelled':
          message = `❌ <b>Ваш заказ отменён / Тапсырысыңыз жойылды</b>\n\n`
          message += `📋 Заказ / Тапсырыс #${order.id.slice(-6)}\n`
          message += `К сожалению, мы не можем выполнить ваш заказ. Приносим извинения.\n`
          message += `Өкінішке орай, тапсырысыңызды орындай алмаймыз. Кешірім сұраймыз.\n\n`
          if (settings?.shop_phone) {
            message += `Если у вас есть вопросы, свяжитесь с нами: ${settings.shop_phone}\n`
            message += `Сұрақтарыңыз болса, бізбен хабарласыңыз: ${settings.shop_phone}`
          }
          break
          
        default:
          return
      }

      await sendNotification(order.telegram_user_id, message)
    } catch (error) {
      console.error('Ошибка отправки уведомления клиенту:', error)
    }
  }

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const order = orders.find(o => o.id === orderId)
      if (!order) return

      await updateOrderStatus(orderId, newStatus)
      await sendStatusNotification(order, newStatus)

      const statusText = {
        'processing': 'в работу',
        'completed': 'выполнен',
        'cancelled': 'отменён'
      }
      
      alert(`✅ Заказ переведён в статус "${statusText[newStatus]}"\n${order.telegram_user_id ? 'Клиенту отправлено уведомление 📱' : ''}`)

    } catch (error) {
      console.error('Ошибка обновления статуса:', error)
      alert('Ошибка обновления статуса')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'new': return 'Новый'
      case 'processing': return 'В работе'
      case 'completed': return 'Выполнен'
      case 'cancelled': return 'Отменён'
      default: return status
    }
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Проверка доступа...</p>
        </div>
      </div>
    )
  }

  if (productsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-gray-800">Админ-панель</h1>
        </div>
        <div className="flex border-t">
          <button 
            onClick={() => setActiveTab('products')} 
            className={`flex-1 py-3 text-sm ${activeTab === 'products' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
          >
            Товары
          </button>
          <button 
            onClick={() => setActiveTab('orders')} 
            className={`flex-1 py-3 text-sm ${activeTab === 'orders' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
          >
            Заказы ({orders.length})
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            className={`flex-1 py-3 text-sm ${activeTab === 'settings' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
          >
            ⚙️ Настройки
          </button>
        </div>
      </div>

      {activeTab === 'products' && (
        <div className="p-4">
          <button 
            onClick={() => setShowProductForm(true)} 
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium mb-4"
          >
            + Добавить товар
          </button>
          <div className="space-y-3">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex gap-3">
                  <img src={product.image} alt={product.name} className="w-20 h-20 object-cover rounded-lg" />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{product.name}</h3>
                    {product.name_kk && (
                      <p className="text-sm text-gray-500">🇰🇿 {product.name_kk}</p>
                    )}
                    <p className="text-sm text-gray-600">{product.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-indigo-600">{product.price} ₸</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">{product.category}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => handleEditProduct(product)} 
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg"
                    >
                      <EditIcon />
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product.id)} 
                      className="p-2 bg-red-50 text-red-600 rounded-lg"
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="p-4">
          {orders.length === 0 ? (
            <div className="text-center py-12"><p className="text-gray-500">Заказов пока нет</p></div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-800">Заказ #{order.id.slice(-6)}</p>
                      <p className="text-xs text-gray-500">{new Date(order.date).toLocaleString('ru-RU')}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  
                  <div className="border-t pt-3 mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Клиент:</p>
                    <p className="text-sm text-gray-600">{order.customer_name}</p>
                    <p className="text-sm text-gray-600">{order.customer_phone}</p>
                    {order.telegram_username && (
                      <p className="text-sm text-blue-600">@{order.telegram_username}</p>
                    )}
                    {order.customer_comment && (
                      <p className="text-sm text-gray-600 mt-1 italic">{order.customer_comment}</p>
                    )}
                  </div>
                  
                  <div className="border-t pt-3 mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Товары:</p>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm mb-1">
                        <span>{item.name} x{item.quantity}</span>
                        <span className="font-medium">{item.price * item.quantity} ₸</span>
                      </div>
                    ))}
                    <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                      <span>Итого:</span>
                      <span className="text-indigo-600">{order.total} ₸</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, 'processing')}
                      disabled={order.status === 'processing'}
                      className={`flex-1 py-2 rounded text-xs font-medium ${
                        order.status === 'processing' 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                      }`}
                    >
                      ⏳ В работу
                    </button>
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                      disabled={order.status === 'completed'}
                      className={`flex-1 py-2 rounded text-xs font-medium ${
                        order.status === 'completed'
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      ✅ Выполнен
                    </button>
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                      disabled={order.status === 'cancelled'}
                      className={`flex-1 py-2 rounded text-xs font-medium ${
                        order.status === 'cancelled'
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      ❌ Отменить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="p-4">
          <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
            <h3 className="font-bold text-lg mb-4">⚙️ Настройки магазина</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название магазина</label>
                <input
                  type="text"
                  value={settings.shop_name}
                  onChange={(e) => saveSettings({...settings, shop_name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Наша Кондитерская"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Телефон заведения</label>
                <input
                  type="text"
                  value={settings.shop_phone}
                  onChange={(e) => saveSettings({...settings, shop_phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="+7 (777) 123-45-67"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Будет показан клиентам при отмене заказа
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Логотип (URL изображения)</label>
                <input
                  type="text"
                  value={settings.shop_logo}
                  onChange={(e) => saveSettings({...settings, shop_logo: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="https://..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Будет показан в шапке витрины. Рекомендуемый размер: 100x100px или 200x60px
                </p>
                {settings.shop_logo && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">Предпросмотр:</p>
                    <img 
                      src={settings.shop_logo} 
                      alt="Логотип" 
                      className="h-12 object-contain"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-bold text-md mb-3">💳 Настройки оплаты Kaspi</h4>
                
                <div className="mb-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.payment_enabled}
                      onChange={(e) => saveSettings({...settings, payment_enabled: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Включить отправку реквизитов для оплаты</span>
                  </label>
                </div>

                {settings.payment_enabled && (
                  <>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Номер телефона Kaspi (без +7)
                      </label>
                      <input
                        type="text"
                        value={settings.kaspi_phone}
                        onChange={(e) => saveSettings({...settings, kaspi_phone: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="7771234567"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ссылка на Kaspi (опционально)
                      </label>
                      <input
                        type="text"
                        value={settings.kaspi_link}
                        onChange={(e) => saveSettings({...settings, kaspi_link: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="https://kaspi.kz/pay/..."
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-2xl p-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editingProduct ? 'Редактировать товар' : 'Добавить товар'}</h2>
              <button onClick={resetForm} className="p-2 text-2xl">×</button>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Мультиязычность:</strong><br/>
                Заполните поля на русском (обязательно) и казахском (опционально). Если казахский не заполнен, будет использоваться русский текст.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold mb-3 text-gray-700">🇷🇺 Русский (обязательно)</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
                    <input 
                      type="text" 
                      value={productForm.name} 
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                      placeholder="Торт Наполеон" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                    <textarea 
                      value={productForm.description} 
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                      rows="2" 
                      placeholder="Классический торт с заварным кремом" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Категория *</label>
                    <input 
                      type="text" 
                      value={productForm.category} 
                      onChange={(e) => setProductForm({...productForm, category: e.target.value})} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                      placeholder="Торты" 
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold mb-3 text-gray-700">🇰🇿 Қазақша (опционально)</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Атауы</label>
                    <input 
                      type="text" 
                      value={productForm.name_kk} 
                      onChange={(e) => setProductForm({...productForm, name_kk: e.target.value})} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                      placeholder="Наполеон торты" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Сипаттама</label>
                    <textarea 
                      value={productForm.description_kk} 
                      onChange={(e) => setProductForm({...productForm, description_kk: e.target.value})} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                      rows="2" 
                      placeholder="Кілегей кремді классикалық торт" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Санат</label>
                    <input 
                      type="text" 
                      value={productForm.category_kk} 
                      onChange={(e) => setProductForm({...productForm, category_kk: e.target.value})} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                      placeholder="Торттар" 
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Цена (₸) *</label>
                <input 
                  type="number" 
                  value={productForm.price} 
                  onChange={(e) => setProductForm({...productForm, price: e.target.value})} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                  placeholder="2500" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL изображения</label>
                <input 
                  type="text" 
                  value={productForm.image} 
                  onChange={(e) => setProductForm({...productForm, image: e.target.value})} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                  placeholder="https://..." 
                />
              </div>
              
              <button 
                onClick={handleSaveProduct} 
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium"
              >
                💾 Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin
