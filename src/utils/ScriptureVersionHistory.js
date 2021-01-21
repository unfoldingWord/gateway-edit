import deepEqual from 'deep-equal';
import { getLocalStorageValue, setLocalStorageValue } from "@utils/LocalStorage";

const maxItems = 5;
const KEY = 'scriptureVersionHistory';

export function updateTitle(resourceLink, title) { // update title for resourceLink
  const history = getLatest();
  const index = findItemIndexByKey(history, 'link', resourceLink);
  if (index >= 0) { // if found then update
    const entry = history[index];
    if (entry.title !== title) {
      entry.title = title; // update the title
      setLocalStorageValue(KEY, history); // persist settings
    }
  }
}

export function updateResourceLink(url, resourceLink) { // update resource link for url
  const history = getLatest();
  const index = findItemIndexByKey(history, 'url', url);
  if (index >= 0) { // if found then update
    const entry = history[index];
    if (entry.link !== resourceLink) {
      entry.link = resourceLink; // update the link
      setLocalStorageValue(KEY, history); // persist settings
    }
  }
}

export function getLatest() {
  const value = getLocalStorageValue(KEY);
  return value || [];
}

export function findItemIndexByKey(history, key, match) {
  const index = history.findIndex((item) => (item[key] === match) );
  return index;
}

export function getItemByTitle(title) {
  const history = getLatest();
  const item = history.find((item) => (item.title === title) );
  return item;
}

export function removeItem(index) {
  let history = getLatest();
  if ((index >= 0) && (index < history.length)) {
    history.splice(index, 1); // remove old item - we will add it back again to the front
    setLocalStorageValue(KEY, history);
  }
}

export function removeUrl(url) {
  const index = findItemIndexByKey(getLatest(), 'url', url);
  if (index >= 0) {
    removeItem(index)
  }
}

export function addItem(newItem) { // add new item to front of the array and only keep up to maxItems
  let history = getLatest();
  let newIndex = -1;
  const index = history.findIndex((item) => (deepEqual(item, newItem)) );
  if (index >= 0) {
    history.splice(index, 1); // remove old item - we will add it back again to the front
  }
  history.unshift(newItem);
  newIndex = 0;

  if (history.length > maxItems) {
    history = history.slice(0, maxItems);
  }

  setLocalStorageValue(KEY, history);
  return newIndex;
}

export default function scriptureVersionHistory() {
  return {addItem, getLatest, updateTitle, findItemIndexByKey};
}
