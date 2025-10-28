import { PlusIcon, MinusIcon, TrashIcon } from './icons'

const CartItem = ({ item, onUpdateQuantity, onRemove, t }) => {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
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
              onClick={() => onUpdateQuantity(item.id, -1)} 
              className="p-1 bg-gray-100 rounded"
            >
              <MinusIcon />
            </button>
            <span className="font-bold">{item.quantity}</span>
            <button 
              onClick={() => onUpdateQuantity(item.id, 1)} 
              className="p-1 bg-gray-100 rounded"
            >
              <PlusIcon />
            </button>
            <button 
              onClick={() => onRemove(item.id)} 
              className="ml-auto text-red-500"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartItem
