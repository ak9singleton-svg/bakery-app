import { RepeatIcon } from './icons'

const OrderItem = ({ order, onRepeatOrder, getStatusText, t, lang }) => {
  const statusInfo = getStatusText(order.status)

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
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
        onClick={() => onRepeatOrder(order)}
        className="w-full py-2 bg-pink-50 text-pink-600 rounded-lg font-medium flex items-center justify-center gap-2"
      >
        <RepeatIcon />
        {t.repeatOrder}
      </button>
    </div>
  )
}

export default OrderItem
