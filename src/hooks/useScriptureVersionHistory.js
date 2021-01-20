import deepEqual from 'deep-equal';
import { useLocalStorage, getLocalStorageValue } from "@hooks/useLocalStorage";
// import {useEffect, useState} from "react";

const maxItems = 5;
// const defaultHistory = JSON.stringify([]);

// function useLocalStorageStr(key, defaultValue = null) {
//   const [value, setValue] = useState(undefined);
//
//   useEffect(() => {
//     console.log(`useLocalStorageStr(${key}) - changed, new value '${value}`);
//     const storedValue = localStorage.getItem(key)
//
//     if (value === undefined) { // if we are initializing
//       if (storedValue !== null) { // already have something saved
//         console.log(`useLocalStorageStr(${key}) - initializing useState to saved localStorage value '${storedValue}'`);
//         setValue(storedValue); // sync saved value
//       } else {
//         let newValue = defaultValue;
//         console.log(`useLocalStorageStr(${key}) - initializing localStorage to default value '${newValue}'`);
//         localStorage.setItem(key, newValue)
//         setValue(newValue);
//       }
//     } else
//     if (storedValue !== value) {
//       console.log(`useLocalStorageStr(${key}) - old localStorage value '${storedValue}'`);
//       console.log(`useLocalStorageStr(${key}) - updating to '${value}'`);
//       localStorage.setItem(key, value)
//     }
//   }, [key, value])
//
//   const value_ = (value !== undefined) ? value : defaultValue;
//   return [value_, setValue]
// }

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

export default function useScriptureVersionHistory() {
  const key = 'scriptureVersionHistory';
  const [history, setHistory] = useLocalStorage(key, [])

  const addItem = (newItem) => { // add new item to front of the array and only keep up to maxItems
    let history_ = history;
    const index = history_.findIndex((item) => (deepEqual(item, newItem)) );
    if (index >= 0) {
      history_.splice(index, 1); // remove old item - we will add it back again to the front
    }
    history_.unshift(newItem);

    if (history_.length > maxItems) {
      history_ = history_.slice(0, maxItems);
    }

    setHistory(history_);
  }

  const getLatest = () => {
    const value = getLocalStorageValue(key);
    return value;
  }

  return {history, addItem, getLatest};
}
