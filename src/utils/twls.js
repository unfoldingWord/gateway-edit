import { isNT, NT_BOOKS, OT_BOOKS } from '../common/BooksOfTheBible';
import { doFetch } from './network';
import { HTTP_CONFIG, HTTP_GET_MAX_WAIT_TIME } from '../common/constants';
import tsvToJson from './tsv';
import { core } from 'scripture-resources-rcl';
import usfmjs from 'usfm-js';
import { delay } from "./delay";
import { tokenizeOrigLang } from "string-punctuation-tokenizer";
import localforage from "localforage";
import * as isEqual from "deep-equal";

const databaseName = 'tWordsDatabase'
const tWordsIndex = 'tWordsIndex'
const tWordsTsv = 'tWordsTsv'
const tWordsUSFM = 'tWordsUsfm'
const chunkSize = 1000
const maxTwordsHours = 8;

function normalizePath(project) {
  // normalize path
  let projectPath = project?.path || ''
  if (projectPath[0] === '.') {
    projectPath = projectPath.substring(1)
  }
  if (projectPath[0] === '/') {
    projectPath = projectPath.substring(1)
  }
  return projectPath;
}

function mergeOlData(twls, bookObject) {
  // merge strongs/lemma/morph data
  for (const item of twls) {
    if (!item) {
      continue
    }
    let quotes = tokenizeOrigLang({text: item.OrigWords || item.OrigQuote, includePunctuation: true}) || []
    if (!Array.isArray(quotes)) {
      quotes = [quotes]
    }

    item.quote = quotes

    let chapter, verse
    const reference = item.Reference
    if (reference) {
      const [c, v] = reference?.split(':')
      chapter = c
      verse = v
    } else {
      chapter = item.Chapter
      verse = item.Verse
    }

    const vos = bookObject?.chapters?.[chapter]?.[verse]?.verseObjects
    const lemma = []
    const strong = []
    const morph = []

    if (vos) {
      for (const quote of quotes) {
        for (const vo of vos) {
          if (vo?.text === quote) {
            lemma.push(vo.lemma)
            strong.push(vo.strong)
            morph.push(vo.morph)
            break;
          }
        }
      }
    }

    if (lemma.length) { // if matches found
      item.lemmas = lemma
      item.strong = strong
      item.morph = morph
    }
  }
}

function timeExpired(savedTime, maxHours) {
  let timeout = false
  if (!savedTime) {
    timeout = true
  } else {
    const elapsedMs = (new Date() - savedTime)
    const elapsedHrs = elapsedMs / (1000 * 60 * 60)
    if (elapsedHrs >= maxHours) {
      timeout = true
    }
  }
  return timeout;
}

export async function loadTwls(resource, owner, repo, bookID){
  const projects = resource?.manifest?.projects
  if (projects?.length) {
    const server = resource?.config?.server;
    let twlData
    let olBibleRepo = null
    let books = null
    let olManifest = null
    let url = null
    let testament
    let twls
    let twIndex

    if (isNT(bookID)) {
      olBibleRepo = "el-x-koine_ugnt"
      books = NT_BOOKS
      testament = 'NT'
    } else {
      olBibleRepo = "hbo_uhb"
      books = OT_BOOKS
      testament = 'OT'
    }

    const config = {
      owner,
      repo,
      server,
    }

    let forceReload = false
    let forceRefetch = false
    const settingsKey = `${testament}-settings`

    try {
      const data = await readFromStorage(tWordsIndex, settingsKey)
      const config_ = data?.config
      const configChanged = !isEqual(config_, config)
      const savedTime = data?.time
      const timeout = timeExpired(savedTime, maxTwordsHours)
      forceReload = configChanged || timeout
      forceRefetch = configChanged
    } catch (e) {
      console.warn(`loadTwls() - error reading indexDB for ${owner}/${olBibleRepo}/${testament}`, e)
    }

    if (!forceReload) {
      try {
        const verifyKeys = [ 'bibleIndex', 'groupIndex', 'lemmaIndex', 'quoteIndex', 'selectionIndex', 'strongsIndex' ]
        const checksStore = `${testament}_checks`;
        let keys = await getKeysFromStorage(checksStore)
        if (keys?.length < 1) {
          console.log(`loadTwls() - missing store ${checksStore}`)
          forceReload = true;
        }

        keys = await getKeysFromStorage(tWordsIndex)
        if (keys?.length) {
          for (const key of verifyKeys) {
            if (!forceReload) {
              const _key = `${testament}_${key}`
              if (!keys.includes(_key)) {
                console.log(`loadTwls() - missing ${_key} in store ${tWordsIndex}`)
                forceReload = true;
              }
            }
          }
        } else {
          console.log(`loadTwls() - missing store ${tWordsIndex}`)
        }

      } catch (e) {
        console.warn(`loadTwls() - error reading indexDB for ${owner}/${olBibleRepo}/${testament}`, e)
        forceReload = true
      }
    }

    if (forceReload) {
      twlData = {}
      const [languageId, resourceId] = olBibleRepo.split('_');
      try {
        const response = await core.getResourceManifest({
          username: owner,
          languageId,
          resourceId,
          config: {
            ...HTTP_CONFIG,
            noCache: false,
            server,
          },
          fullResponse: true,
        })
        olManifest = response?.manifest
      } catch (e) {
        console.warn(`loadTwls() - error getting manifest for ${owner}/${olBibleRepo}`, e)
        books = []
      }

      for (const book of books) {
        let timeout = true

        try {
          const data = await readFromStorage(tWordsTsv, book)
          twls = data?.twls
          const savedTime = data?.time
          timeout = timeExpired(savedTime, maxTwordsHours)
        } catch (e) {
          console.warn(`loadTwls() - error reading indexDB for ${owner}/${olBibleRepo}/${testament}`, e)
        }

        if (forceRefetch || !twls || timeout) {
          const project = projects?.find(p => (p.identifier === book))
          const book_ = project?.identifier
          if (!book_) {
            console.log('book not found', book)
            continue
          }

          let projectPath = normalizePath(project);

          url = `${server}/${owner}/${repo}/raw/branch/master/${projectPath}`
          let data = await doFetch(url, null, HTTP_GET_MAX_WAIT_TIME, false).then(response => {
            if (response?.status !== 200) {
              const errorCode = response?.status
              console.warn(`loadTwls() - error getting TWL data from ${url}, ${errorCode}`)
              return null
            }
            return response?.data
          })

          if (!data) {
            continue;
          }

          await delay(500) // add pause for UI operations
          twls = tsvToJson(data)
          console.log(`loadTwls() - fetched data for ${owner}/${repo}/${projectPath}, file size`, twls?.length)

          const olProject = olManifest?.projects?.find(p => (p.identifier === book))
          const _book = olProject?.identifier
          if (!_book) {
            console.log('OL book not found', book)
            continue
          }

          projectPath = normalizePath(olProject);

          url = `${server}/${owner}/${olBibleRepo}/raw/branch/master/${projectPath}`
          data = await doFetch(url, null, HTTP_GET_MAX_WAIT_TIME, false).then(response => {
            if (response?.status !== 200) {
              const errorCode = response?.status
              console.warn(`ResourceCard - error getting bible from ${url}, ${errorCode}`)
              return null
            }
            return response?.data
          })

          if (!data) {
            continue
          }

          const bookObject = usfmjs.toJSON(data);
          // console.log('bookObject', bookObject)
          await delay(500) // add pause for UI operations
          mergeOlData(twls, bookObject)

          await saveToStorage(tWordsTsv, book, { time: new Date(), twls })
          await saveToStorage(tWordsUSFM, book, { time: new Date(), bookObject })
        } else {
          console.log(`loadTwls() - found cached data for ${owner}/${olBibleRepo}/${book}`)
        }

        twlData[book] = twls
      }

      const twIndex = await indexTwords(twlData)
      for (const key of Object.keys(twIndex)) {
        await delay(500)
        const saveKey = `${testament}_${key}`
        console.log(`loadTwls() - saving key ${saveKey}`)
        if (key === 'checks') {
          await loadDataStorage(saveKey, twIndex[key])
        } else {
          await saveToStorage(tWordsIndex, saveKey, twIndex[key])
        }
      }

      const time = new Date();
      await saveToStorage(tWordsIndex, settingsKey, { time, config })
      console.log(`loadTwls() - DONE generating tWords index`)
    } else {
      console.log(`loadTwls() - data already cached, nothing to do for ${owner}/${olBibleRepo}/${testament}`)
    }
  }
}

function addCheckToIndex(previousCheck, item, fullRef, checks, selectionIndex, checkKey, location) {
  if (!previousCheck) {
    item.refs = [fullRef];
    checks.push(item);
    selectionIndex[checkKey] = location
  } else {
    location = previousCheck;
    const check = checks[previousCheck];
    const refs = check.refs;
    if (! fullRef in refs) {
      refs.push(fullRef);
    }
  }
  return location;
}

function addItemToIndex(index, key, item, location, lowerCase = false) {
  const value = item?.[key] || [];
  let valueStr = Array.isArray(value) ? value.join(' ') : value;

  if (lowerCase) {
    valueStr = valueStr.toLowerCase()
  }

  let list = findItem(index, valueStr, true);
  pushUnique(list, location);
  // if items value is an array and there are multiple values, add each value separately
  if (value?.length > 1) {
    for (let _value of value) {
      if (lowerCase) {
        _value = _value.toLowerCase()
      }
      list = findItem(index, _value, true);
      pushUnique(list, location);
    }
  }
}

/**
 * index twords for resource
 * @param {array} twlData
 * @returns {object}
 */
export async function indexTwords(twlData) {
  let checks = [];
  const bibleIndex = {};
  const groupIndex = {};
  const lemmaIndex = {};
  const quoteIndex = {};
  const strongsIndex = {};
  const selectionIndex = {};
  const twLinkMatch = /^rc:\/\/\*\/tw\/dict\/bible\/(\w+)\/([\w\d]+)/;
  const twLinkRE = new RegExp(twLinkMatch);

  const bookIds = Object.keys(twlData)
  for (let j = 0; j < bookIds.length; j++) {
    const bookId = bookIds[j]
    console.log(`indexTwords() - processing book: ${bookId}`);
    await delay(500);

    try {
      const data = twlData[bookId]
      for (const item of data) {
        const reference = item?.Reference || `${item?.Chapter}:${item?.Verse}`
        let quote = item?.quote || '';

        if (Array.isArray(quote)) {
          quote = quote.join(' ');
        }

        item.quoteString = quote;
        let location = checks.length;
        // like rc://*/tw/dict/bible/names/seth
        const twLink = item.TWLink.match(twLinkRE);
        if (!twLink) {
          console.warn(`indexTwords() - invalid TWLink: ${item.TWLink}`);
          continue;
        }

        item.Catagory = twLink[1];
        const groupId = twLink[2];
        item.GroupID = groupId;

        const checkKey = `${item.Catagory}_${groupId}_${quote}`;
        let previousCheck = selectionIndex[checkKey];
        const fullRef = `${bookId} ${reference}`
        location = addCheckToIndex(previousCheck, item, fullRef, checks, selectionIndex, checkKey, location);

        const [chapter, verse] = reference.split(':');

        addItemToIndex(strongsIndex, 'strong', item, location);
        addItemToIndex(lemmaIndex, 'lemmas', item, location);
        addItemToIndex(quoteIndex, 'quote', item, location, true);

        const bookIndex = findItem(bibleIndex, bookId, false);
        const chapterIndex = findItem(bookIndex, chapter, false);
        const verseList = findItem(chapterIndex, verse, true);
        const groupList = findItem(groupIndex, groupId, true);

        pushUnique(verseList, location);
        pushUnique(groupList, location);
      }
    } catch (e) {
      console.warn(`indexTwords() - could not read ${bookId}`);
    }
  }

  const indices = {
    checks,
    bibleIndex,
    groupIndex,
    lemmaIndex,
    quoteIndex,
    selectionIndex,
    strongsIndex,
  };
  console.log(`indexTwords() - found ${checks?.length} checks, ${Object.keys(bibleIndex).length} bibleIndex, ${Object.keys(groupIndex).length} groupIndex, ${Object.keys(quoteIndex).length} quoteIndex, ${Object.keys(selectionIndex).length} selectionIndex, ${Object.keys(strongsIndex).length} strongsIndex,`);
  return indices;
}

function initializeDataStorage(storeName) {
  const db = localforage.createInstance({
    name: databaseName,
    storeName,
  });
  return db;
}

async function saveChunk(db, key, subData, count) {
  await db.setItem(key, subData);
  // verify data
  const value = await db.getItem(key);
  if (!value?.length) {
    console.warn(`initializeAndLoadDataStorage() - chunk ${count} did not verify`)
    return false
  }
  return true
}

export async function loadDataStorage(storeName, data) {
  try {
    const db = initializeDataStorage(storeName);
    if (Array.isArray(data)) {
      const len = data.length
      let count = 0
      while (count < len) {
        const subData = data.slice(count, count + chunkSize)
        const key = `${count}`;
        let success = await saveChunk(db, key, subData, count);
        if (!success) {
          success = await saveChunk(db, key, subData, count);
        }
        count+= chunkSize
      }
    } else {
      for (const key in data) {
        const dataItem = data[key]
        await db.setItem(key, dataItem);
      }
    }
  } catch (e) {
    console.log(`loadDataStorage - Error saving to database ${storeName}:`, e);
    return null;
  }
}

export async function saveToStorage(storeName, key, data) {
  const db = initializeDataStorage(storeName);
  await db.setItem(key, data);
}

export async function readFromStorage(storeName, key) {
  try {
    const db = initializeDataStorage(storeName);
    const value = await db.getItem(key);
    // console.log(`read value for ${key}`, value);
    return value
  } catch (e) {
    console.log(`readFromStorage - Error reading database ${storeName}:`, e);
    return null;
  }
}

export async function getKeysFromStorage(storeName) {
  try {
    const db = initializeDataStorage(storeName);
    const value = await db.keys();
    // console.log(`read value for ${key}`, value);
    return value
  } catch (e) {
    console.log(`getKeysFromStorage - Error reading database ${storeName}:`, e);
    return null;
  }
}

/**
 * find item in object, if not found then add newItem
 * @param {object} object
 * @param {*} item
 * @param {boolean} newItemIsArray - if true then new item is an empty array, otherwise make it an empty object
 * @returns {*}
 */
function findItem(object, item, newItemIsArray = false) {
  let verseList = object[item];

  if (!verseList) {
    verseList = newItemIsArray ? [] : {};
    object[item] = verseList;
  }
  return verseList;
}

/**
 * push item if it is not already in array
 * @param array
 * @param item
 */
function pushUnique(array, item) {
  const duplicate = array.includes(item); // ignore duplicates

  if (!duplicate) {
    array.push(item);
  }
}

async function fetchChecksByIndex(checksToLookUp, checksDb) {
  const checksFound = {}
  let checkChunkLoaded = null
  let checkChunk

  if (checksToLookUp?.length) {
    checksToLookUp.sort((a, b) => a - b)
    for (const index of checksToLookUp) {
      const chunkOffset = index % chunkSize
      const chunkId = (index - chunkOffset) / chunkSize
      const chunkKey = `${chunkId * chunkSize}`;
      if (chunkKey !== checkChunkLoaded) {
        checkChunk = await readFromStorage(checksDb, chunkKey)
        if (checkChunk) {
          checkChunkLoaded = chunkKey
        }
      }
      if (checkChunk) {
        checksFound[index] = checkChunk[chunkOffset]
      }
    }

    return checksFound
  }
  return null
}

export async function findQuoteMatches(bookID, chapter, verse, quote) {
  const _quoteWords = Array.isArray(quote) ? quote : (quote || '').split(' ')
  let testament = isNT(bookID) ? 'NT' : 'OT'
  const matchedIndices = {}
  let checksToLookUp = []

  try {
    const quotesIndices = await getChecksForWords('quoteIndex', testament, _quoteWords)

    // if (quoteIndex) {
    //   for (const quoteWord of _quoteWords) {
    //     const _quoteWord = quoteWord.toLowerCase()
    //     const checkIndices = quoteIndex[_quoteWord]
    //     if (checkIndices?.length) {
    //       matchedIndices[quoteWord] = checkIndices
    //       console.log(checkIndices)
    //       if (!checksToLookUp?.length) {
    //         checksToLookUp = checkIndices
    //       } else {
    //         for (const check of checkIndices) {
    //           if (!checkIndices.includes(check)) {
    //             checksToLookUp.push(check)
    //           }
    //         }
    //       }
    //     }
    //   }
    // }

    let checks = []
    let missingWord = false

    for (const quote of Object.keys(quotesIndices)) {
      const checks_ = quotesIndices[quote]

      const checkKeys = checks_ ? Object.keys(checks_) : []

      if (checkKeys?.length) {
        checkKeys.forEach(key => checks.push(checks_[key]))
      } else {
        missingWord = true
      }
    }

    if (checks?.length) {
      const { sortedChecks, sortedtWords } = getSortedListOfChecks(checks)
      console.log(sortedtWords)
    }

    if (missingWord || !checks?.length) {
      const data = await readFromStorage(tWordsUSFM, bookID)
      const bookObject = data?.bookObject

      if (bookObject) {
        const strongWords = []

        for (const quote of Object.keys(quotesIndices)) {
          const vo = findWordInVerse(bookObject, chapter, verse, quote)
          console.log(vo)

          if (vo?.strongs) {
            strongWords.push(vo.strongs)
          }
        }

        const strongsIndices = await getChecksForWords('strongsIndex', testament, strongWords)
        console.log(strongsIndices)
      }
    }

    if (checksToLookUp?.length) {
      const checksDb = `${testament}_checks`
      const checks = await fetchChecksByIndex(checksToLookUp, checksDb)
      const checksSorted = getSortedListOfChecks(checks, _quoteWords)
      const strongs = getStrongsFromChecks(checks)
      if (strongs?.length) {
        const indexKey = `strongsIndex`
        const checks_ = await getChecksForWords(indexKey, testament, strongs)
      }
    }
  } catch (e) {
    console.warn(`findQuoteMatches(${bookID}, ${chapter}, ${verse}, ${quote} - exception`, e)
  }
  console.log('found', matchedIndices)
}

/**
 * search through verse objects to find alignment for quote and occurrence
 * @param verseObjects
 * @param {string} quote
 * @returns {string|null|*}
 */
function findMatch(verseObjects, quote) {
  quote = quote.toLowerCase()

  for (const vo of verseObjects) {
    const word = vo?.text?.toLowerCase() || vo?.word?.toLowerCase()

    if (word === quote) {
      return vo
    } else if (vo.children) {
      const vo_ = findMatch(vo.children, quote)

      if (vo_) {
        return vo_
      }
    }
  }
  return null
}

function findWordInVerse(bookObject, chapter, verse, quote) {
  if (quote && bookObject) {
    const verseObjects = bookObject[chapter]?.[verse]?.verseObjects || []
    const vo = findMatch(verseObjects, quote)
    return vo
  }
}

export async function getChecksForWords(indexKey, testament, wordsList) {
  const indexName = `${testament}_${indexKey}`
  const checksDb = `${testament}_checks`
  const wordsIndex = await readFromStorage(tWordsIndex, indexName)
  let checks_ = null
  const index = {}

  if (wordsIndex) {
    for (const word of wordsList) {
      checks_ = null
      const checksToLookUp_ = wordsIndex[word.toLowerCase()]
      checks_ = await fetchChecksByIndex(checksToLookUp_, checksDb)
      console.log(checks_)
      index[word] = checks_
    }
  }

  return index
}

// function addWordsInOrderOfRefsCount(checksMerged, matchedQuote, bestMatches) {
//   const tWords = checksMerged[matchedQuote]
//   const sortedList = Object.keys(tWords).sort((a, b) => (-tWords[a].refs?.length + tWords[b].refs?.length));
//   sortedList.forEach(item => bestMatches.push(tWords[item]))
// }
//
// function getCountForKey(checksMerged, ref, key) {
//   const tWords = checksMerged[ref];
//   const keys = Object.keys(tWords)
//   let count = 10000
//   if (keys.length) {
//     const firstKey = keys[0]
//     const firstItem = tWords[firstKey];
//     const keyItem = firstItem?.[key];
//     count = keyItem?.length || count
//   }
//   return count
// }

export function getStrongsFromChecks(checks) {
  const strongs = {}
  // merge and index checks
  for (const key of Object.keys(checks)) {
    const check = checks[key]
    for (const strong of check?.strong) {
      let found = strongs[strong]
      if (!found) {
        strongs[strong] = check.refs?.length || 1
      } else {
        strongs[strong] = found + check.refs?.length || 1
      }
    }
  }
  const sorted = Object.keys(strongs).sort((a, b) => (-strongs[a] + strongs[b]))
  return sorted
}

export function getSortedListOfChecks(checks) {
  const tWords = {}
  // merge and index checks
  for (const key of Object.keys(checks)) {
    const check = checks[key]
    const tWord = `${check.Catagory}/${check.GroupID}`
    let list = tWords[tWord]
    if (!list) {
      list = []
      tWords[tWord] = list
    }
    // add each ref separately
    const refs = check.refs
    for (const ref of refs) {
      const _check = {
        ...check,
        refs: [ref],
      }
      list.push(_check)
    }
  }

  // order the matches in descending order of usage
  const sortedChecks = Object.keys(tWords).sort((a, b) => (-tWords[a]?.length + tWords[b]?.length))
  const sortedtWords = sortedChecks.map(tWord => tWords[tWord])
  // const bestMatches = []
  // const unusedKeys = Object.keys(checksMerged)
  // // first priority is exact match
  // let index = unusedKeys.indexOf(quoteWords.join(' '));
  // if (index >= 0) {
  //   const matchedQuote = unusedKeys[index];
  //   addWordsInOrderOfRefsCount(checksMerged, matchedQuote, bestMatches);
  //   unusedKeys.splice(index, 1);
  // }
  // const tWordsIndex = {}
  // unusedKeys.sort((a, b) => {
  //   // do primary sort on quote count
  //   const aQuoteCount = getCountForKey(checksMerged, a, 'quote')
  //   const bQuoteCount = getCountForKey(checksMerged, b, 'quote')
  //   let diff = aQuoteCount - bQuoteCount
  //   if (diff === 0) { // if quote counts the same, do secondary inverse sort on refs count
  //     const aRefsCount = getCountForKey(checksMerged, a, 'refs')
  //     const bRefsCount = getCountForKey(checksMerged, b, 'refs')
  //     diff = -(aRefsCount - bRefsCount)
  //   }
  //   return diff
  // })

  return { sortedChecks, sortedtWords }
}

