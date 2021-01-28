export function getLocalStorageValue(key) {
  let storedValue = localStorage.getItem(key)

  if (storedValue !== null) {
    try {
      storedValue = JSON.parse(storedValue);
    } catch (e) {
      storedValue = null;
    }
  }
  return storedValue;
}

export function setLocalStorageValue(key, newValue) {
  localStorage.setItem(key, JSON.stringify(newValue))
}
