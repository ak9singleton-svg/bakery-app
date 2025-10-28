import { useState, useEffect } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useOrders } from '../hooks/useOrders'
import { useSettings } from '../hooks/useSettings'
import { sendNotification } from '../services/supabase'
import { getTelegramUser, showTelegramBackButton, hideTelegramBackButton } from '../utils/telegram'
import { ShoppingCartIcon, HistoryIcon, StoreIcon, PlusIcon, MinusIcon, TrashIcon, RepeatIcon } from '../components/icons'

// Переводы (из вашего оригинального кода)
const translations = {
  ru: {
    shopTitle: "Наша Кондитерская",
    cart: "Корзина",
    addToCart: "В корзину",
    checkout: "Оформить заказ",
    total: "Итого",
    myOrders: "Мои заказы",
    orderHistory: "История заказов",
    repeatOrder: "Повторить заказ",
    all: "Все",
    cartEmpty: "Корзина пуста",
    noOrders: "У вас пока нет заказов",
    checkoutTitle: "Оформление заказа",
    name: "Имя",
    phone: "Телефон",
    comment: "Комментарий",
    commentPlaceholder: "Укажите способ получения и другие детали",
    yourOrder: "Ваш заказ:",
    submitOrder: "Отправить заказ",
    fillRequired: "Пожалуйста, заполните имя и телефон",
    orderSuccess: "Спасибо за заказ!\n\nМы получили ваш заказ и скоро свяжемся с вами.",
    paymentInfo: "Реквизиты для оплаты отправлены вам в личные сообщения бота.",
    paymentNote: "После оформления заказа мы отправим вам реквизиты для оплаты в Kaspi",
    hello: "Привет",
    orderStatuses: {
      new: "Новый",
      processing: "В работе",
      completed: "Выполнен",
      cancelled: "Отменён"
    }
  },
  kk: {
    shopTitle: "Біздің кондитерлік",
    cart: "Себет",
    addToCart: "Себетке",
    checkout: "Тапсырыс беру",
    total: "Барлығы",
    myOrders: "Менің тапсырыстарым",
    orderHistory: "Тапсырыстар тарихы",
    repeatOrder: "Тапсырысты қайталау",
    all: "Барлығы",
    cartEmpty: "Себет бос",
    noOrders: "Сізде әлі тапсырыстар жоқ",
    checkoutTitle: "Тапсырысты рәсімдеу",
    name: "Аты",
    phone: "Телефон",
    comment: "Түсініктеме",
    commentPlaceholder: "Алу әдісін және басқа мәліметтерді көрсетіңіз",
    yourOrder: "Сіздің тапсырысыңыз:",
    submitOrder: "Тапсырыс жіберу",
    fillRequired: "Атыңызды және телефонды толтырыңыз",
    orderSuccess: "Тапсырысыңызға рахмет!\n\nТапсырысыңызды алдық, жақын арада хабарласамыз.",
    paymentInfo: "Төлем деректемелері ботқа жеке хабарларда жіберілді.",
    paymentNote: "Тапсырысты рәсімдегеннен кейін Kaspi-де төлеу үшін деректемелерді жібереміз",
    hello: "Сәлем",
    orderStatuses: {
      new: "Жаңа",
      processing: "Орындалуда",
      completed: "Орындалды",
      cancelled: "Жойылды"
    }
  }
}

const Shop = () => {
  const [view, setView] = useState('catalog')
  const [cart, setCart] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [lang, setLang] = useState('ru')
  const [telegramUser, setTelegramUser] = useState(null)
  const [orderForm, setOrderForm] = useState({
    name: '',
    phone: '',
    comment: ''
  })

  const { products, loading: productsLoading } = useProducts()
  const { orders, addOrder } = useOrders(telegramUser?.id)
  const { settings } = useSettings()

  const t = translations[lang]

  // Инициализация Telegram WebApp
  useEffect(() => {
    const user = getTelegramUser()
    if (user) {
      setTelegramUser(user)
      setOrderForm(prev => ({
        ...prev,
        name: user.first_name + (user.last_name ? ' ' + user.last_name : '')
      }))

      // Автоопределение языка из Telegram
      const tgLang = user.language_code
      const savedLang = localStorage.getItem('app_language')
      
      if (savedLang) {
        setLang(savedLang)
      } else if (tgLang === 'kk' || tgLang === 'ru') {
        setLang(tgLang)
        localStorage.setItem('app_language', tgLang)
      }
    }
  }, [])

  // Управление кнопкой "Назад" в Telegram
  useEffect(() => {
    if (view === 'cart' || view === 'history') {
      showTelegramBackButton(() => {
        if (view === 'cart' || view === 'history') setView('catalog')
        else if (view === 'checkout') setView('cart')
      })
    } else {
      hideTelegramBackButton()
    }
  }, [view])

  const changeLanguage = (newLang) => {
    setLang(newLang)
    localStorage.setItem('app_language', newLang)
  }

  const categories = ['all', ...new Set(products.map(p => p.category))]
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory)

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => 
      item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
    ).filter(item => item.quantity > 0))
  }

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id))
  }

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const repeatOrder = (order) => {
    setCart(order.items.map(item => ({
      ...item,
      ...products.find(p => p.id === item.id || p.name === item.name)
    })))
    setView('cart')
  }

  const getProductName = (product) => {
    return lang === 'kk' && product.name_kk ? product.name_kk : product.name
  }

  const getProductDescription = (product) => {
    return lang === 'kk' && product.description_kk ? product.description_kk : product.description
  }

  const getProductCategory = (product) => {
    return lang === 'kk' && product.category_kk ? product.category_kk : product.category
  }

  const getStatusText = (status) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      processing: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return { 
      text: t.orderStatuses[status] || status, 
      color: colors[status] || 'bg-gray-100 text-gray-800' 
    }
  }

  const sendTelegramNotification = async (order) => {
    try {
      let message = "🆕 <b>НОВЫЙ ЗАКАЗ!</b>\n\n"
      message += `📋 Заказ #${order.id.slice(-6)}\n`
      message += `📅 ${new Date(order.date).toLocaleString('ru-RU')}\n\n`
      
      message += "<b>👤 Клиент:</b>\n"
      message += `Имя: ${order.customer_name}\n`
      message += `Телефон: ${order.customer_phone}\n`
      if (order.telegram_username) message += `Telegram: @${order.telegram_username}\n`
      if (order.telegram_user_id) message += `ID: ${order.telegram_user_id}\n`
      if (order.customer_comment) message += `\nКомментарий: ${order.customer_comment}\n`
      
      message += "\n<b>🛒 Товары:</b>\n"
      order.items.forEach(item => {
        message += `• ${item.name} x${item.quantity} = ${item.price * item.quantity} ₸\n`
      })
      
      message += `\n<b>💰 Итого: ${order.total} ₸</b>`

      const adminId = import.meta.env.VITE_ADMIN_ID
      await sendNotification(adminId, message)
    } catch (error) {
      console.error('Ошибка отправки уведомления админу:', error)
    }
  }

  const sendPaymentInfo = async (order) => {
    if (!settings?.payment_enabled || !order.telegram_user_id) return

    try {
      let message = "💳 <b>Реквизиты для оплаты / Төлем деректемелері</b>\n\n"
      message += `📋 Заказ / Тапсырыс #${order.id.slice(-6)}\n`
      message += `💰 Сумма / Сомасы: <b>${order.total} ₸</b>\n\n`
      
      if (settings.kaspi_phone) {
        message += `📱 <b>Kaspi номер:</b>\n+7${settings.kaspi_phone}\n\n`
      }
      
      message += "После оплаты, пожалуйста, отправьте скриншот чека владельцу магазина.\n"
      message += "Төлегеннен кейін чектің скриншотын дүкен иесіне жіберіңіз.\n\n"
      message += "Спасибо за заказ! / Тапсырысыңызға рахмет! ❤️"

      await sendNotification(order.telegram_user_id, message)
    } catch (error) {
      console.error('Ошибка отправки реквизитов:', error)
    }
  }

  const submitOrder = async () => {
    if (!orderForm.name || !orderForm.phone) {
      alert(t.fillRequired)
      return
    }

    const order = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      customer_name: orderForm.name,
      customer_phone: orderForm.phone,
      customer_comment: orderForm.comment,
      telegram_user_id: telegramUser?.id || null,
      telegram_username: telegramUser?.username || null,
      telegram_first_name: telegramUser?.first_name || null,
      telegram_last_name: telegramUser?.last_name || null,
      items: cart,
      total: getTotalPrice(),
      status: 'new'
    }

    try {
      await addOrder(order)
      await sendTelegramNotification(order)
      await sendPaymentInfo(order)

      setCart([])
      setOrderForm({ ...orderForm, comment: '' })
      setView('catalog')
      
      let successMessage = t.orderSuccess
      if (settings?.payment_enabled && telegramUser) {
        successMessage += '\n\n💳 ' + t.paymentInfo
      }
      
      alert(successMessage)
      
    } catch (error) {
      console.error('Ошибка при отправке заказа:', error)
      alert('⚠️ Ошибка при отправке заказа. Попробуйте ещё раз.')
    }
  }

  if (productsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{lang === 'kk' ? 'Жүктелуде...' : 'Загрузка...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50">
      {view === 'catalog' && (
        <div className="pb-20">
          <div className="bg-white shadow-sm sticky top-0 z-10">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  {settings?.shop_logo ? (
                    <div className="flex items-center gap-3">
                      <img 
                        src={settings.shop_logo} 
                        alt={settings.shop_name}
                        className="h-10 object-contain"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                      <div>
                        <h1 className="text-xl font-bold text-gray-800">{settings.shop_name}</h1>
                        {telegramUser && (
                          <p className="text-xs text-gray-500">{t.hello}, {telegramUser.first_name}!</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <StoreIcon />
                      <div>
                        <h1 className="text-xl font-bold text-gray-800">{settings?.shop_name || t.shopTitle}</h1>
                        {telegramUser && (
                          <p className="text-xs text-gray-500">{t.hello}, {telegramUser.first_name}!</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 items-center">
                  {/* Переключатель языка */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => changeLanguage('ru')}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        lang === 'ru' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                      }`}
                    >
                      РУ
                    </button>
                    <button
                      onClick={() => changeLanguage('kk')}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        lang === 'kk' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                      }`}
                    >
                      ҚҚ
                    </button>
                  </div>
                  
                  {telegramUser && (
                    <button
                      onClick={() => setView('history')}
                      className="p-2 bg-gray-100 text-gray-700 rounded-full"
                    >
                      <HistoryIcon />
                    </button>
                  )}
                  <button onClick={() => setView('cart')} className="relative p-2 bg-pink-500 text-white rounded-full">
                    <ShoppingCartIcon />
                    {cart.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {cart.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap ${
                      selectedCategory === cat ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {cat === 'all' ? t.all : getProductCategory({ category: cat, category_kk: cat })}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 grid grid-cols-1 gap-4">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <img 
                  src={product.image} 
                  alt={getProductName(product)} 
                  className="w-full h-48 object-cover" 
                />
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-800">{getProductName(product)}</h3>
                  <p className="text-gray-600 text-sm mt-1">{getProductDescription(product)}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xl font-bold text-pink-500">{product.price} ₸</span>
                    <button 
                      onClick={() => addToCart(product)} 
                      className="bg-pink-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <PlusIcon /> {t.addToCart}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'history' && (
        <div className="p-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t.myOrders}</h2>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <HistoryIcon />
              <p className="text-gray-500 mt-4">{t.noOrders}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => {
                const statusInfo = getStatusText(order.status)
                return (
                  <div key={order.id} className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-gray-800">
                          {lang === 'kk' ? 'Тапсырыс' : 'Заказ'} #{order.id.slice(-6)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.date).toLocaleDateString(lang === 'kk' ? 'kk-KZ' : 'ru-RU')}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                    </div>
                    
                    <div className="border-t pt-3 mb-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm mb-1">
                          <span>{item.name} x{item.quantity}</span>
                          <span className="font-medium">{item.price * item.quantity} ₸</span>
                        </div>
                      ))}
                      <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                        <span>{t.total}:</span>
                        <span className="text-pink-500">{order.total} ₸</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => repeatOrder(order)}
                      className="w-full py-2 bg-pink-50 text-pink-600 rounded-lg font-medium flex items-center justify-center gap-2"
                    >
                      <RepeatIcon />
                      {t.repeatOrder}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {view === 'cart' && (
        <div className="p-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t.cart}</h2>
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">{t.cartEmpty}</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {cart.map(item => (
                  <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex gap-4">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-20 h-20 object-cover rounded-lg" 
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800">{item.name}</h3>
                        <p className="text-pink-500 font-bold">{item.price} ₸</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)} 
                            className="p-1 bg-gray-100 rounded"
                          >
                            <MinusIcon />
                          </button>
                          <span className="font-bold">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)} 
                            className="p-1 bg-gray-100 rounded"
                          >
                            <PlusIcon />
                          </button>
                          <button 
                            onClick={() => removeFromCart(item.id)} 
                            className="ml-auto text-red-500"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">{t.total}:</span>
                  <span className="text-2xl font-bold text-pink-500">{getTotalPrice()} ₸</span>
                </div>
              </div>
              <button onClick={() => setView('checkout')} className="w-full bg-pink-500 text-white py-3 rounded-lg font-bold">
                {t.checkout}
              </button>
            </>
          )}
        </div>
      )}

      {view === 'checkout' && (
        <div className="p-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t.checkoutTitle}</h2>
          
          {settings?.payment_enabled && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                💳 {t.paymentNote}
              </p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.name} *</label>
              <input
                type="text"
                value={orderForm.name}
                onChange={(e) => setOrderForm({...orderForm, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder={lang === 'kk' ? 'Атыңызды енгізіңіз' : 'Введите ваше имя'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.phone} *</label>
              <input
                type="tel"
                value={orderForm.phone}
                onChange={(e) => setOrderForm({...orderForm, phone: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="+7 (___) ___-__-__"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.comment}</label>
              <textarea
                value={orderForm.comment}
                onChange={(e) => setOrderForm({...orderForm, comment: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows="3"
                placeholder={t.commentPlaceholder}
              />
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold mb-2">{t.yourOrder}</h3>
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-sm mb-1">
                  <span>{item.name} x{item.quantity}</span>
                  <span>{item.price * item.quantity} ₸</span>
                </div>
              ))}
              <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                <span>{t.total}:</span>
                <span className="text-pink-500">{getTotalPrice()} ₸</span>
              </div>
            </div>
            <button onClick={submitOrder} className="w-full bg-pink-500 text-white py-3 rounded-lg font-bold">
              {t.submitOrder}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Shop