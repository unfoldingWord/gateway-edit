import PropTypes from 'prop-types'
import {
  Card,
  useCardState,
} from 'translation-helps-rcl'
import { ScripturePane } from "single-scripture-rcl";
import { getLanguage } from "@common/languages";
import {getItemByTitle, updateTitle} from "@utils/ScriptureVersionHistory";
import { getScriptureVersionSettings, useScriptureSettings } from "@hooks/useScriptureSettings";

const label = 'Version';
const style = {marginTop: '16px', width: '500px'};

export default function ScriptureCard(Props) {
  const {
    cardNum,
    title,
    chapter,
    verse,
    server,
    owner,
    branch,
    languageId,
    classes,
    bookId,
    resourceId,
    disableWordPopover
  } = Props;

  const { scriptureConfig, scriptureResource, setScripture } = useScriptureSettings(Props);

  if (scriptureConfig.title) {
    updateTitle(scriptureConfig.resourceLink, scriptureConfig.title);
  }

  function getDropDownConfig() {
    const scriptureConfig_ = {...scriptureConfig};
    scriptureConfig_.content = !!scriptureConfig.content;
    console.log(`getDropDownConfig(${cardNum}) - new scripture (scriptureConfig): ${JSON.stringify(scriptureConfig_)}`)
    console.log(`getDropDownConfig(${cardNum}) - new state: ${JSON.stringify(scriptureResource)}`)
    const dropDownConfig = getScriptureVersionSettings({
      label,
      resourceLink: scriptureConfig.resourceLink,
      style
    });

    const onChangeOrig = dropDownConfig.onChange;
    dropDownConfig.onChangeOrig = onChangeOrig;
    dropDownConfig.onChange = (title, index) => {
      console.log(`onChange(${cardNum}) - new state: ${JSON.stringify({title, index})}`)

      if (onChangeOrig) {
        onChangeOrig(title, index);
        const item = getItemByTitle(title);
        console.log(`onChange(${cardNum}) - new state: ${JSON.stringify(item)}`)
        if (item) {
          setScripture(item);
        }
      }
    }

    return dropDownConfig;
  }

  const language = getLanguage({ languageId: scriptureConfig?.resource?.languageId });
  const direction = (language?.direction) || 'ltr';

  const items = null;
  const {
    state: { item, headers, filters, fontSize, itemIndex, markdownView },
    actions: { setFilters, setFontSize, setItemIndex, setMarkdownView },
  } = useCardState({
    items,
  });

  const refStyle = {
    fontFamily: "Noto Sans",
    fontSize: `${Math.round(fontSize * 0.9)}%`,
  }

  const contentStyle = {
    fontFamily: "Noto Sans",
    fontSize: `${fontSize}%`,
  }

  return (
    <Card
      items={items}
      classes={classes}
      headers={headers}
      filters={filters}
      fontSize={fontSize}
      itemIndex={itemIndex}
      setFilters={setFilters}
      setFontSize={setFontSize}
      setItemIndex={setItemIndex}
      markdownView={markdownView}
      setMarkdownView={setMarkdownView}
      hideMarkdownToggle={true}
      getDropDownConfig={getDropDownConfig}
      title={title}
    >
      <ScripturePane refStyle={refStyle} contentStyle={contentStyle} {...scriptureConfig} direction={direction}/>
    </Card>
  )
}

ScriptureCard.propTypes = {
  cardNum: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  chapter: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  verse: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  server: PropTypes.string.isRequired,
  owner: PropTypes.string.isRequired,
  branch: PropTypes.string.isRequired,
  languageId: PropTypes.string.isRequired,
  bookId: PropTypes.string.isRequired,
  resourceId: PropTypes.string.isRequired,
  disableWordPopover: PropTypes.bool
}
