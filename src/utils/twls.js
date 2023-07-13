import { isNT, NT_BOOKS, OT_BOOKS } from '../common/BooksOfTheBible';
import { doFetch } from './network';
import { HTTP_CONFIG, HTTP_GET_MAX_WAIT_TIME } from '../common/constants';
import tsvToJson from './tsv';
import { core } from 'scripture-resources-rcl';
import usfmjs from 'usfm-js';
import {delay} from "./delay";
import {tokenizeOrigLang} from "string-punctuation-tokenizer";
import localforage from "localforage";

const databaseName = 'tWordsDatabase'
const tWordsIndex = 'tWordsIndex';
const tWordsTsv = 'tWordsTsv';

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

export async function loadTwls(resource, owner, repo, bookID){
  const projects = resource?.manifest?.projects
  if (projects?.length) {
    let twlData
    let olBibleRepo = null
    let books = null
    let olManifest = null
    let url = null
    let testament
    let twls

    if (isNT(bookID)) {
      olBibleRepo = "el-x-koine_ugnt"
      books = NT_BOOKS
      testament = 'NT'
    } else {
      olBibleRepo = "hbo_uhb"
      books = OT_BOOKS
      testament = 'OT'
    }

    const testamentKey = `${testament}-index`;
    try {
      const data = await readFromStorage(tWordsIndex, testamentKey)
      const twIndex = data?.twIndex
      if (twIndex) { // if already cached, then nothing to do
        return
      }
    } catch (e) {
      console.warn(`loadTwls() - error reading indexDB for ${owner}/${olBibleRepo}/${testament}`, e)
    }

    if (!twlData || !Object.keys(twlData).length) {
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
            server: resource?.config?.server,
          },
          fullResponse: true,
        })
        olManifest = response?.manifest
      } catch (e) {
        console.warn(`loadTwls() - error getting manifest for ${owner}/${olBibleRepo}`, e)
        books = []
      }

      for (const book of books) {

        try {
          const data = await readFromStorage(tWordsTsv, book)
          twls = data?.twls
        } catch (e) {
          console.warn(`loadTwls() - error reading indexDB for ${owner}/${olBibleRepo}/${testament}`, e)
        }

        if (!twls) {
          const project = projects?.find(p => (p.identifier === book))
          const book_ = project?.identifier
          if (!book_) {
            console.log('book not found', book)
            continue
          }

          console.log('tsv project found', project)
          let projectPath = normalizePath(project);

          url = `${resource?.config?.server}/${owner}/${repo}/raw/branch/master/${projectPath}`
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
          console.log(`fetched data for ${owner}/${repo}/${projectPath}, file size`, twls?.length)

          const olProject = olManifest?.projects?.find(p => (p.identifier === book))
          const _book = olProject?.identifier
          if (!_book) {
            console.log('OL book not found', book)
            continue
          }

          projectPath = normalizePath(olProject);

          url = `${resource?.config?.server}/${owner}/${olBibleRepo}/raw/branch/master/${projectPath}`
          data = await doFetch(url, null, HTTP_GET_MAX_WAIT_TIME, false).then(response => {
            if (response?.status !== 200) {
              const errorCode = response?.status
              console.warn(`ResourceCard - error getting TWL data from ${url}, ${errorCode}`)
              return null
            }
            return response?.data
          })

          if (!data) {
            continue;
          }

          const bookObject = usfmjs.toJSON(data);
          console.log('bookObject', bookObject)
          await delay(500) // add pause for UI operations
          mergeOlData(twls, bookObject);

          await saveToStorage(tWordsTsv, book, { time: new Date(), twls })
        } else {
          console.log(`loadTwls() - found cached data for ${owner}/${olBibleRepo}/${book}`)
        }

        twlData[book] = twls
      }
      console.log(`twlData`, twlData)
    }

    const twIndex = await indexTwords(twlData)
    for (const key of Object.keys(twIndex)) {
      await initializeAndLoadDataStorage(key, twIndex[key])
    }
    console.log(`twIndex`, twIndex)
    return twlData;
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

        if (!previousCheck) {
          item.refs = [fullRef];
          checks.push(item);
          selectionIndex[checkKey] = location
        } else {
          location = previousCheck;
          const check = checks[previousCheck];
          check.refs.push(fullRef);
        }

        const [chapter, verse] = reference.split(':');

        let strongs = item?.strong || [];
        strongs = Array.isArray(strongs) ? strongs.join(' ') : strongs;
        const strongsList = findItem(strongsIndex, strongs, true);
        pushUnique(strongsList, location);

        const quoteList = findItem(quoteIndex, quote, true);
        pushUnique(quoteList, location);

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

export async function initializeAndLoadDataStorage(storeName, data) {
  try {
    const results = localforage.dropInstance({
      name: databaseName,
      storeName,
    });
    const db = initializeDataStorage(storeName);
    for (const key in data) {
      const dataItem = data[key]
      await db.setItem(key, dataItem);
    }
  } catch (e) {
    console.log('Error initializing database:', e);
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
    console.log('Error reading database:', e);
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
