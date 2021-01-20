import useScriptureVersionHistory from "@hooks/useScriptureVersionHistory";

export default function useScriptureVersionSettings({label, currentTitle, currentUrl, style, scriptureVersionHistory}) {
  const {history, addItem} = scriptureVersionHistory;

  const versions = history?.length ? history.slice() : [];
  versions.unshift({url: currentUrl, title: currentTitle});

  const dropDownConfig = {
    label,
    options: versions,
    current: 0,
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
