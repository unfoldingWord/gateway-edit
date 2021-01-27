import { useState } from 'react'

// based on example at https://usehooks.com/useLocalStorage/

export default function useLocalStorage(key, initialValue) {

  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Get from local storage by key
      const item = localStorage.getItem(key);
      // if (item) {
      //   console.log(`useLocalStorage(${key}) - initializing to stored value '${item}'`);
      // } else {
      //   console.log(`useLocalStorage(${key}) - initializing to default value '${JSON.stringify(initialValue)}'`);
      // }
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log(`useLocalStorage(${key}) - init error:'`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = value => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      let valueJSON = JSON.stringify(valueToStore);
      localStorage.setItem(key, valueJSON);
      // console.log(`useLocalStorage(${key}) - setting value to '${valueJSON}'`);
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(`useLocalStorage.setValue(${key}) - error:'`, error);
    }
  };

  return [storedValue, setValue];
}
