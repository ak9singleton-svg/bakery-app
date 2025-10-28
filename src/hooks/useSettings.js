import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

export const useSettings = () => {
  const [settings, setSettings] = useState({
    kaspi_phone: '',
    kaspi_link: '',
    shop_name: 'Наша Кондитерская',
    shop_phone: '',
    shop_logo: '',
    payment_enabled: false
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      if (data) {
        setSettings(data)
      }
    } catch (err) {
      console.error('Error loading settings:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (newSettings) => {
    try {
      setError(null)
      
      // Используем upsert для создания или обновления настроек
      const { data, error } = await supabase
        .from('settings')
        .upsert(newSettings, { onConflict: 'id' })
        .select()

      if (error) throw error
      
      setSettings(data[0])
      return data[0]
    } catch (err) {
      console.error('Error saving settings:', err)
      setError(err.message)
      throw err
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  return {
    settings,
    loading,
    error,
    loadSettings,
    saveSettings
  }
}
