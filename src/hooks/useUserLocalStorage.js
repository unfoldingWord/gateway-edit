import { useEffect, useState } from 'react'

export function useUserLocalStorage(username, key, initialValue) {
  const [currentValue, setCurrentValue_] = useState(initialValue)
  const setCurrentValue = (newValue) => setUserItem(key, currentValue, setCurrentValue_, newValue, username)
  const refreshSettings = () => refreshUserItem(key, currentValue, setCurrentValue_, initialValue, username)

  useEffect(() => {
    refreshSettings()
  }, [username])

  return [currentValue, setCurrentValue, refreshSettings]
}

/**
 * will combine username and baseKey into unique settings key
 * @param username - string
 * @param baseKey - string
 * @return {string} key for user settings
 */
function getUserKey(username, baseKey) {
  const key_ = username ? `${username}_${baseKey}` : baseKey // get user key
  return key_
}

/**
 * set new value for user setting in both useState and localStorage if changes
 * @param key - string - base key that will be prepended with username
 * @param currentValue - current value for setting
 * @param setItem - callback function - called to update useState
 * @param newValue
 * @param username - string - user to save settings for
 */
function setUserItem(key, currentValue, setItem, newValue, username) {
  const key_ = getUserKey(username, key)
  // Allow value to be a function so we have same API as useState
  const valueToStore =
    newValue instanceof Function ? newValue(currentValue) : newValue
  const newValueStr = JSON.stringify(valueToStore)

  if (JSON.stringify(currentValue) !== newValueStr) {
    console.log(`setUserItem(${key_}) - saving new value ${newValueStr}`)
    localStorage.setItem(key_, newValueStr)
    setItem && setItem(valueToStore)
  }
}

/**
 * refresh saved value for user setting from localStorage if found, otherwise set to initialValue
 * @param key - string - base key that will be prepended with username
 * @param currentValue - current value for setting
 * @param setItem - callback function - called to update useState
 * @param initialValue - initial value to use if no setting found
 * @param username - string - user to save settings for
 * @return {any} returns current value
 */
function refreshUserItem(key, currentValue, setItem, initialValue, username) {
  const key_ = getUserKey(username, key)
  let savedValue = getUserItem(key_)

  if (savedValue === null) {
    savedValue = initialValue

    if (initialValue !== null) {
      localStorage.setItem(key_, JSON.stringify(initialValue)) // update with initial value
    }
  }

  setUserItem(key, currentValue, setItem, savedValue, username)
  return savedValue
}

/**
 * reads item from local storage
 * @param key - key for item
 * @return {any}
 */
function getUserItem(key) {
  let savedValue = localStorage.getItem(key)
  console.log(`getUserItem(${key}) - stored value ${savedValue}`)

  if (savedValue !== null) {
    try {
      savedValue = JSON.parse(savedValue)
    } catch {
      savedValue = null // if not parsable
    }
  }
  return savedValue
}

export default useUserLocalStorage
