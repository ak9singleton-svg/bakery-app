import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

export const useProducts = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading products...')
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('Products data:', data)
      console.log('Products error:', error)

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error('Error loading products:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addProduct = async (productData) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()

      if (error) throw error
      
      setProducts(prev => [data[0], ...prev])
      return data[0]
    } catch (err) {
      console.error('Error adding product:', err)
      setError(err.message)
      throw err
    }
  }

  const updateProduct = async (id, productData) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()

      if (error) throw error
      
      setProducts(prev => prev.map(p => p.id === id ? data[0] : p))
      return data[0]
    } catch (err) {
      console.error('Error updating product:', err)
      setError(err.message)
      throw err
    }
  }

  const deleteProduct = async (id) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      console.error('Error deleting product:', err)
      setError(err.message)
      throw err
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  return {
    products,
    loading,
    error,
    loadProducts,
    addProduct,
    updateProduct,
    deleteProduct
  }
}
