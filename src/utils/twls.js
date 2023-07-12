import { isNT, NT_BOOKS, OT_BOOKS } from '../common/BooksOfTheBible';
import { doFetch } from './network';
import { HTTP_CONFIG, HTTP_GET_MAX_WAIT_TIME } from '../common/constants';
import tsvToJson from './tsv';
import { core } from 'scripture-resources-rcl';
import usfmjs from 'usfm-js';
import {delay} from "./delay";
import {tokenizeOrigLang} from "string-punctuation-tokenizer";

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

export async function loadTwls(resource, owner, repo, bookID){
  const projects = resource?.manifest?.projects
  if (projects?.length) {
    const twlData = {}
    let olBibleRepo = null
    let books = null
    let olManifest = null
    let url = null

    if (isNT(bookID)) {
      olBibleRepo = "el-x-koine_ugnt"
      books = NT_BOOKS
    } else {
      olBibleRepo = "hbo_uhb"
      books = OT_BOOKS
    }

    const [ languageId, resourceId ] = olBibleRepo.split('_');
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
      const twls = tsvToJson(data)
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

      // merge strongs/lemma/morph data
      for (const item of twls) {
        if (!item) {
          continue
        }
        let quotes = tokenizeOrigLang({ text: item.OrigWords || item.OrigQuote, includePunctuation: true }) || []
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

      twlData[book] = twls
    }

    console.log(`twlData`, twlData)
    return twlData;
  }
}

/**
 * index twords for resource
 * @param {array} twls
 * @returns {object}
 */
export async function indexTwords(twls) {
  let checks = [];
  const bibleIndex = {};
  const groupIndex = {};
  const quoteIndex = {};
  const strongsIndex = {};
  const alignmentIndex = {};

  const bookId = Object.keys(twls)
  for (let j = 0; j < bookId.length; j++) {
    await delay(500);

    try {
      const data = twls[bookId]
      for (const item of data) {
        const contextId = item?.contextId;
        const reference = contextId?.reference;
        let quote = normalizer(contextId?.quote || '');

        if (Array.isArray(quote)) {
          const quote_ = quote.map(item => item.word);
          quote = quote_.join(' ');
        }

        item.quoteString = quote;
        let location = checks.length;
        const alignmentKey = `${groupId}_${quote}`;
        let previousCheck = alignmentIndex[alignmentKey];

        if (!previousCheck) {
          item.refs = [reference];
          checks.push(item);
        } else {
          location = previousCheck;
          const check = checks[previousCheck];
          check.refs.push(reference);
        }

        const chapter = reference?.chapter;

        let strongs = contextId?.strong || [];
        strongs = Array.isArray(strongs) ? strongs.join(' ') : '';
        item.strong = strongs;
        const strongsList = findItem(strongsIndex, strongs, true);
        pushUnique(strongsList, location);

        const quoteList = findItem(quoteIndex, quote, true);
        pushUnique(quoteList, location);

        const bookIndex = findItem(bibleIndex, bookId, false);
        const chapterIndex = findItem(bookIndex, chapter, false);
        const verse = reference?.verse;
        const verseList = findItem(chapterIndex, verse, true);

        pushUnique(verseList, location);
        pushUnique(groupList, location);
      }
      // console.log(data);
    } catch (e) {
      console.warn(`could not read ${bookId}`);
    }
  }

  return {
    bibleIndex,
    groupIndex,
    quoteIndex,
    strongsIndex,
    checks,
  };
}

const databaseName = 'historyDatabase'
const storeName = 'tWordsData';

export function saveToIndexDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);

    request.onupgradeneeded = function (event) {
      const db = event.target.result;
      const objectStore = db.createObjectStore(storeName, {keyPath: 'id'});
    };

    request.onsuccess = function (event) {
      const db = event.target.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const objectStore = transaction.objectStore(storeName);

      const myObject = {id: 1, name: 'John Doe'};
      objectStore.put(myObject);

      transaction.oncomplete = function () {
        console.log('Object successfully saved!');
        resolve(null)
      };

      transaction.onerror = function (event) {
        console.log('Error saving object:', event.target.error);
        reject(event.target.error)
      };
    };
  })
}

export function readFromIndexDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);

    request.onsuccess = function (event) {
      const db = event.target.result;
      const transaction = db.transaction([storeName], 'readonly');
      const objectStore = transaction.objectStore(storeName);

      const request = objectStore.get(1);

      request.onsuccess = function (event) {
        const myObject = event.target.result;
        console.log(myObject);
        resolve(myObject)
      };

      request.onerror = function (event) {
        console.log('Error reading object:', event.target.error);
        reject(event.target.error)
      };
    };
  })
}
