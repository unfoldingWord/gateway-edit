import useEffect from 'use-deep-compare-effect';
import { useState } from 'react'
import deepEqual from 'deep-equal';

export default function useLocalStorage(key, defaultValue = null) {
  const [value, setValue] = useState(undefined)

  useEffect(() => {
    console.log(`useLocalStorage(${key}) - changed, new value`, value);
    let storedValue = getLocalStorageValue(key);

    if (value === undefined) { // if we are initializing
      if (storedValue !== null) { // already have something saved
        console.log(`useLocalStorageStr(${key}) - initializing useState to saved localStorage value '${storedValue}'`);
        setValue(storedValue); // sync saved value
      } else { // nothing saved, initialize to default
        let newValue = defaultValue;
        console.log(`useLocalStorageStr(${key}) - initializing localStorage to default value '${newValue}'`);
        localStorage.setItem(key, JSON.stringify(newValue))
        setValue(newValue);
      }
    } else
    if (!deepEqual(storedValue, value)) {
      console.log(`useLocalStorageStr(${key}) - old localStorage value '${storedValue}'`);
      console.log(`useLocalStorageStr(${key}) - updating to '${value}'`);
      localStorage.setItem(key, JSON.stringify(value))
    }
  }, [{key, value}])

  const value_ = (value !== undefined) ? value : defaultValue; // if not yet initialized, use default value
  return [value_, setValue]
}
