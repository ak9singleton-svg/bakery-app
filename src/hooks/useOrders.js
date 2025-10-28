import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

export const useOrders = (telegramUserId = null) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let query = supabase
        .from('orders')
        .select('*')
        .order('date', { ascending: false })

      // Если передан telegramUserId, загружаем только заказы этого пользователя
      if (telegramUserId) {
        query = query.eq('telegram_user_id', telegramUserId)
      }

      const { data, error } = await query

      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      console.error('Error loading orders:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addOrder = async (orderData) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()

      if (error) throw error
      
      setOrders(prev => [data[0], ...prev])
      return data[0]
    } catch (err) {
      console.error('Error adding order:', err)
      setError(err.message)
      throw err
    }
  }

  const updateOrderStatus = async (id, status) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()

      if (error) throw error
      
      setOrders(prev => prev.map(o => o.id === id ? data[0] : o))
      return data[0]
    } catch (err) {
      console.error('Error updating order status:', err)
      setError(err.message)
      throw err
    }
  }

  useEffect(() => {
    loadOrders()
  }, [telegramUserId])

  return {
    orders,
    loading,
    error,
    loadOrders,
    addOrder,
    updateOrderStatus
  }
}
