import { useState, useEffect } from 'react'

export default function useLocalStorage(key, defaultValue = null) {
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    const value = localStorage.getItem(key)

    if (value !== null) {
      setValue(JSON.parse(value))
    }
  }, [key])

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}
