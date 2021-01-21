import useEffect from 'use-deep-compare-effect';
import { useState } from 'react'
import deepEqual from 'deep-equal';
import { getLocalStorageValue, setLocalStorageValue } from "@utils/LocalStorage";

export default function useLocalStorage(key, defaultValue = null) {
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    console.log(`useLocalStorage(${key}) - key changed, new value`, value);
    const storedValue = getLocalStorageValue(key);

    if (!deepEqual(storedValue, value)) {
      console.log(`useLocalStorage(${key}) - old localStorage value '${storedValue}', updating to '${value}'`);
      setValue(storedValue)
    }
  }, [{key}])

  useEffect(() => {
    console.log(`useLocalStorage(${key}) - key or value changed, new value`, value);
    const storedValue = getLocalStorageValue(key);

    if (!deepEqual(storedValue, value)) {
      console.log(`useLocalStorage(${key}) - old localStorage value '${storedValue}', updating to '${value}'`);
      setLocalStorageValue(key, value);
    }
  }, [{key, value}])

  return [value, setValue]
}
