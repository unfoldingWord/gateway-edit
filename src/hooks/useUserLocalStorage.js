import { useEffect, useState } from 'react'
import * as isEqual from 'deep-equal'

/**
 * use hook for accessing local starage for user
 * @param {Object} username
 * @param {string} key
 * @param {any} initialValue
 * @return {any[]}
 */
export function useUserLocalStorage(username, key, initialValue) {
  const [currentValue, setCurrentValue_] = useState(initialValue)
  const setCurrentValue = (newValue) => setUserItem(key, currentValue, setCurrentValue_, newValue, username)
  const readSavedValue = () => readUserItem(key, currentValue, setCurrentValue_, initialValue, username)

  useEffect(() => {
    if (username) {
      readSavedValue() // update once we have username or it has changed
    }
  }, [username])

  return [currentValue, setCurrentValue, readSavedValue]
}

/**
 * will combine username and baseKey into unique settings key
 * @param {string} username
 * @param {string} baseKey
 * @return {string} key for user settings
 */
export function getUserKey(username, baseKey) {
  const key_ = username ? `${username}_${baseKey}` : baseKey // get user key
  return key_
}

/**
 * set new value for user setting in both useState and localStorage if changed
 * @param {string} key - base key that will be prepended with username
 * @param {any} currentValue - current value for setting
 * @param {function} setState - callback function - called to update useState
 * @param {any} newValue
 * @param {string} username
 */
export function setUserItem(key, currentValue, setState, newValue, username) {
  const key_ = getUserKey(username, key)
  // Allow value to be a function so we have same API as useState
  const valueToStore =
    newValue instanceof Function ? newValue(currentValue) : newValue
  const valueToStoreStr = JSON.stringify(valueToStore)
  localStorage.setItem(key_, valueToStoreStr)
  setState && setState(valueToStore)
}

/**
 * refresh saved value for user setting from localStorage if found, otherwise set to initialValue
 * @param {string} key - base key that will be prepended with username
 * @param {any} currentValue - current value for setting
 * @param {function} setState - callback function - called to update useState
 * @param {any} initialValue - initial value to use if no setting found
 * @param {string} username - user to save settings for
 * @return {any} returns current value
 */
export function readUserItem(key, currentValue, setState, initialValue, username) {
  const key_ = getUserKey(username, key)
  let savedValue = getUserItem(key_)

  if (savedValue === null) {
    savedValue = initialValue

    if (initialValue !== null) {
      setUserItem(key, currentValue, setState, savedValue, username)
    }
  }

  if (!isEqual(currentValue, savedValue)) {
    setState(savedValue)
  }
  return savedValue
}

/**
 * reads item from local storage
 * @param {string} key - key for item
 * @return {any}
 */
export function getUserItem(key) {
  let savedValue = localStorage.getItem(key)

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
