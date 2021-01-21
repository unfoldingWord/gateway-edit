import {
  addItem,
  findItemIndexByKey,
  getLatest,
  removeUrl,
  updateResourceLink,
  updateTitle
} from "@utils/ScriptureVersionHistory";
import {useResourceManifest, useScripture} from "single-scripture-rcl";
import useLocalStorage from "@hooks/useLocalStorage";
import { core } from 'scripture-resources-rcl';
import {getLocalStorageValue} from "@utils/LocalStorage";

const KEY_BASE = 'scripturePaneConfig_'
export function useScriptureSettings(props) {
  const {
    cardNum,
    title,
    chapter,
    verse,
    server,
    owner,
    branch,
    languageId,
    bookId,
    resourceId,
    disableWordPopover
  } = props;

  const key = KEY_BASE + cardNum;
  const storedValue = getLocalStorageValue(key);
  const initialValue = storedValue || {
    title,
    server,
    owner,
    branch,
    languageId,
    resourceId,
    disableWordPopover
  }

  const [scriptureSettings, setScriptureSettings] = useLocalStorage(key, initialValue);

  const scriptureConfig = useScripture({
    reference: {
      projectId: bookId,
      chapter: chapter,
      verse: verse,
    },
    resource: {
      languageId: scriptureSettings.languageId,
      projectId: scriptureSettings.resourceId,
      owner: scriptureSettings.owner,
      branch: scriptureSettings.branch,
    },
    config: {
      server: scriptureSettings.server,
      cache: { maxAge: 1 * 1 * 1 * 60 * 1000 },
    },
    disableWordPopover: scriptureSettings.disableWordPopover,
  });

  const setScripture = (item) => {
    if (item?.url) {
      //TODO blm: add validation "https://git.door43.org/ru_gl/ru_rsob"

      const url = new URL(item.url);
      let server_;
      let hostname = url.hostname;
      if (hostname) {
        if (url.port) {
          hostname += ':' + url.port;
        }
        server_ = "https://" + hostname;
      }

      core.resourceFromResourceLink({
        resourceLink: item.url,
        reference: {
          projectId: bookId,
          chapter: chapter,
          verse: verse,
        },
        config: {
          server: server_,
          cache: { maxAge: 1 * 1 * 1 * 60 * 1000 },
        },
      }).then(resource => {
        let error = true;
        if (resource) {
          console.log(resource);
          const {title, version} = useResourceManifest(resource);
          if (title && version) {
            // we succeeded in getting resource - use it
            updateResourceLink(item.url, resource.resourceLink);
            updateTitle(resource.resourceLink, title);
            setScriptureSettings({
              title,
              server: server_,
              owner: resource.username,
              branch: resource.tag,
              languageId: resource.languageId,
              resourceId: resource.resourceId,
              disableWordPopover //TODO blm: need to calculate this based on language
            });
            error = false;
          } else {
            console.error('error passing manifest', item.url);
          }
        } else {
          console.error('not found', item.url);
        }
        if (error) {
          removeUrl(item.url);
        }
      })
    }
  }

  return { scriptureConfig, setScripture };
}

export function getScriptureVersionSettings({label, currentTitle, currentLink, style}) {
  const history = getLatest();
  const versions = history?.length ? history.slice() : [];
  let index = findItemIndexByKey(versions, 'link', currentLink);
  if (index < 0) { // if current is not in list, add it
    versions.unshift({link: currentLink, title: currentTitle});
    index = 0;
  } else {
    updateTitle(currentLink, currentTitle);
  }

  const dropDownConfig = {
    label,
    options: versions,
    current: index,
    allowUserInput: true,
    onChange: (title, index) => {
      console.log(`New selection index ${index}, title: `, title);
      if ((index < 0) && title) {
        const newItem = {
          url: title,
          title,
        }
        addItem(newItem);
      }
    },
    style,
  }

  return dropDownConfig;
}

export default useScriptureSettings;
