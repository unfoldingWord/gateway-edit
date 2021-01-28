import { getLocalStorageValue, setLocalStorageValue } from '@utils/LocalStorage';

const maxItems = 7;
const KEY = 'scriptureVersionHistory';

export function updateTitle(resourceLink, title) { // update title for resourceLink
  const history = getLatest();
  const index = findItemIndexByKey(history, 'resourceLink', resourceLink);
  const entry = getItemByIndex(index);

  if (entry) {
    if (entry.title !== title) {
      entry.title = title; // update the title
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

function getItemByIndex(index, history = null) {
  if (!history) {
    history = getLatest();
  }

  return (index >= 0) ? history[index] : null;
}

export function getItemByTitle(title) {
  const history = getLatest();
  const index = findItemIndexByKey(history, 'title', title)
  return getItemByIndex(index, history);
}

export function removeItemByIndex(index) {
  let history = getLatest();

  if ((index >= 0) && (index < history.length)) {
    history.splice(index, 1); // remove old item - we will add it back again to the front
    setLocalStorageValue(KEY, history);
  }
}

export function removeUrl(url) {
  const index = findItemIndexByKey(getLatest(), 'url', url);

  if (index >= 0) {
    removeItemByIndex(index)
  }
}

export function findItem(matchItem, history) {
  if (!history) {
    history = getLatest();
  }

  const index = history.findIndex((item) => (
    (item.server === matchItem.server) &&
    (item.resourceLink === matchItem.resourceLink)));
  return index;
}

export function addItemToHistory(newItem) { // add new item to front of the array and only keep up to maxItems
  let history = getLatest();
  let newIndex = -1;
  let index = findItem(newItem, history);

  if (index < 0) {
    history.unshift(newItem);
    index = 0;
  }

  if (history.length > maxItems) {
    history = history.slice(0, maxItems);
  }

  setLocalStorageValue(KEY, history);
  return newIndex;
}
