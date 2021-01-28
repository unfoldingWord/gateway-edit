import {
  addItemToHistory,
  findItemIndexByKey,
  getLatest,
  removeItemByIndex,
  removeUrl,
} from "@utils/ScriptureVersionHistory";
import {useResourceManifest, useScripture} from "single-scripture-rcl";
import useLocalStorage from "@hooks/useLocalStorage";
import { core } from 'scripture-resources-rcl';
import {NT_BOOKS, NT_ORIG_LANG, NT_ORIG_LANG_BIBLE, OT_ORIG_LANG, OT_ORIG_LANG_BIBLE} from "@common/BooksOfTheBible";

export const ORIGINAL_SOURCE = 'ORIGINAL_SOURCE';
export const TARGET_LITERAL = 'TARGET_LITERAL';
export const TARGET_SIMPLIFIED = 'TARGET_SIMPLIFIED';
export const DISABLE_WORD_POPOVER = true;
const KEY_BASE = 'scripturePaneConfig_'

function getResourceLink(scripture) {
  return `${scripture.owner}/${scripture.languageId}/${scripture.resourceId}/${scripture.branch}`;
}

export function getScriptureObject(scripture_) {
  let {
    title,
    server,
    owner,
    branch,
    languageId,
    resourceId,
    disableWordPopover
  } = scripture_;

  const scripture = {
    title,
    server,
    owner,
    branch,
    languageId,
    resourceId,
    disableWordPopover
  };
  if (!scripture.resourceLink) {
    scripture.resourceLink = getResourceLink(scripture);
  }
  return scripture;
}

function getDefaultSettings(bookId, scriptureSettings_) {
  const scriptureSettings = {...scriptureSettings_};
  scriptureSettings.disableWordPopover = DISABLE_WORD_POPOVER;
  if (scriptureSettings_.resourceId === ORIGINAL_SOURCE) {
    // select original language Bible based on which testament the book is
    const isNewTestament = NT_BOOKS.includes(bookId)
    scriptureSettings.languageId = isNewTestament ? NT_ORIG_LANG : OT_ORIG_LANG
    scriptureSettings.resourceId = isNewTestament
      ? NT_ORIG_LANG_BIBLE
      : OT_ORIG_LANG_BIBLE
    scriptureSettings.resourceLink = getResourceLink(scriptureSettings);
    scriptureSettings.disableWordPopover = false;
  } else if (scriptureSettings_.resourceId === TARGET_LITERAL) {
    scriptureSettings.resourceId = scriptureSettings.languageId === 'en' ? 'ult' : 'glt';
    scriptureSettings.resourceLink = getResourceLink(scriptureSettings);
  } else if (scriptureSettings_.resourceId === TARGET_SIMPLIFIED) {
    scriptureSettings.resourceId = scriptureSettings.languageId === 'en' ? 'ust' : 'gst';
    scriptureSettings.resourceLink = getResourceLink(scriptureSettings);
  }
  return scriptureSettings;
}

function useScriptureResources(bookId, scriptureSettings, chapter, verse) {
   const scriptureSettings_ = getDefaultSettings(bookId, scriptureSettings);

  const scriptureConfig_ = {
    reference: {
      projectId: bookId,
      chapter: chapter,
      verse: verse,
    },
    resource: {
      languageId: scriptureSettings_.languageId,
      projectId: scriptureSettings_.resourceId,
      owner: scriptureSettings_.owner,
      branch: scriptureSettings_.branch,
    },
    config: {
      server: scriptureSettings_.server,
      cache: {maxAge: 60 * 1000},
    },
    disableWordPopover: scriptureSettings_.disableWordPopover,
  };

  const scriptureResource = useScripture(scriptureConfig_);

  // restore any default settings
  scriptureResource.resourceLink = scriptureSettings.resourceLink
  return scriptureResource;
}

export function useScriptureSettings(props) {
  const {
    cardNum,
    chapter,
    verse,
    bookId,
    resourceId,
    disableWordPopover
  } = props;

  const key = KEY_BASE + cardNum;
  const scriptureResource = getScriptureObject(props); // scripture resource based on default settings
  let [scriptureSettings, setScriptureSettings] = useLocalStorage(key, scriptureResource);

  addItemToHistory(scriptureSettings); // make sure current item persisted in local storage
  const scriptureConfig = useScriptureResources(bookId, scriptureSettings, chapter, verse);

  const scriptureConfig_ = {...scriptureConfig};
  scriptureConfig_.content = !!scriptureConfig.content;

  const setScripture = (item) => {
    let url;
    if (item?.url) {
      try {
        url = new URL(item.url);
      } catch {
        console.error('illegal url', item.url);
        return;
      }
    }
    if (url) {
      let server_;
      let hostname = url.hostname;
      if (hostname) {
        if (url.port) {
          hostname += ':' + url.port;
        }
        server_ = "https://" + hostname;
      }

      let url_ = item.url;
      if (!url) { // if not a new resource
        scriptureSettings = getDefaultSettings(resourceId, bookId, item);
        url_ = scriptureSettings.resourceLink;
      }

      // make sure it exists
      core.resourceFromResourceLink({
        resourceLink: url_,
        reference: {
          projectId: bookId,
          chapter: chapter,
          verse: verse,
        },
        config: {
          server: server_,
          cache: { maxAge: 60 * 1000 },
        },
      }).then(resource => {
        if (resource) {
          const {title, version} = useResourceManifest(resource);
          if (title && version) {
            // we succeeded in getting resource - use it
            const newScripture = getScriptureObject({
              title,
              server: server_,
              owner: resource.username,
              branch: resource.tag,
              languageId: resource.languageId,
              resourceId: resource.resourceId,
              resourceLink: resource.resourceLink,
              disableWordPopover
            })
            newScripture.userAdded = true;
            addItemToHistory(newScripture); // persist in local storage
            setScriptureSettings(newScripture);
          } else {
            console.error('error passing manifest', item.url);
          }
        } else {
          console.error('not found', item.url);
        }
        removeUrl(item.url);
      })
    } else { // selected a previous setting
      console.log(`setScripture(${cardNum}) - setScriptureSettings to: ${JSON.stringify(item)}`)
      setScriptureSettings(item);
    }
  }

  return { scriptureConfig, setScripture };
}

export function getScriptureVersionSettings({label, resourceLink, style}) {
  const history = getLatest();
  let index = findItemIndexByKey(history, 'resourceLink', resourceLink);

  const dropDownConfig = {
    label, // label for combobox
    options: history,
    current: index,
    allowUserInput: true,
    onChange: (title, index) => {
      if ((index < 0) && title) {
        const newItem = {
          url: title,
          title,
        }
        addItemToHistory(newItem);
      }
    },
    deleteItem: title => {
      const history = getLatest();
      const deleteIndex = findItemIndexByKey(history, 'title', title);
      removeItemByIndex(deleteIndex);
    },
    style,
  }

  return dropDownConfig;
}

export default useScriptureSettings;
