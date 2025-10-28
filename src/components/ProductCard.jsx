import { PlusIcon } from './icons'

const ProductCard = ({ product, onAddToCart, getProductName, getProductDescription, getProductCategory, t }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
            onClick={() => onAddToCart(product)} 
            className="bg-pink-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <PlusIcon /> {t.addToCart}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
