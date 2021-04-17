/**
 * class for accessing local storage for user
 */
export class UserLocalStorage {
  /**
   * constructor
   * @param {string} userName - user name for local storage
   */
  constructor(userName) {
    this.userName = userName
  }

  /**
   * prepend user name to key to get unique key for user
   * @param {string} key
   * @return {string}
   */
  getUserKey(key) {
    return this.userName ? `${this.userName}_${key}` : key
  }

  /**
   * save value to user's local storage
   * @param {string} key
   * @param {value} value
   */
  save(key, value) {
    setLocalStorageValue(this.getUserKey(key), value) // persist settings
  }

  /**
   * read value from user's local storage
   * @param {string} key
   * @return {any}
   */
  read(key) {
    return getLocalStorageValue(this.getUserKey(key)) // read saved settings
  }
}

/**
 * low level read of local storage and parse from JSON to value (with error handling)
 * @param {string} key
 * @return {any}
 */
export function getLocalStorageValue(key) {
  let storedValue = localStorage.getItem(key)

  if (storedValue !== null) {
    try {
      storedValue = JSON.parse(storedValue)
    } catch (e) {
      console.error(`getLocalStorageValue(${key}) - JSON.parse failed`, e)
      storedValue = null
    }
  }
  return storedValue
}

/**
 * low level save to local storage of value as JSON (with error handling)
 * @param {string} key
 * @param {any} newValue
 */
export function setLocalStorageValue(key, newValue) {
  try {
    localStorage.setItem(key, JSON.stringify(newValue))
  } catch (e) {
    console.error(`setLocalStorageValue(${key}) - write failed`, e)
  }
}

