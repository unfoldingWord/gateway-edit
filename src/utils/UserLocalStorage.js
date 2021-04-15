export class UserLocalStorage {
  constructor(userName) {
    this.userName = userName
  }

  getUserKey(key) {
    return this.userName ? `${this.userName}_${key}` : key
  }

  save(key, value) {
    setLocalStorageValue(this.getUserKey(key), value) // persist settings
  }

  read(key) {
    return getLocalStorageValue(this.getUserKey(key)) // read saved settings
  }
}

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

export function setLocalStorageValue(key, newValue) {
  try {
    localStorage.setItem(key, JSON.stringify(newValue))
  } catch (e) {
    console.error(`setLocalStorageValue(${key}) - write failed`, e)
  }
}

