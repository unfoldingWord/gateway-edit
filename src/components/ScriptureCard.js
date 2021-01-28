import PropTypes from 'prop-types'
import { Card, useCardState } from 'translation-helps-rcl'
import { ScripturePane } from 'single-scripture-rcl'
import { getLanguage } from '@common/languages'
import { ComboBox } from '@components/ComboBox';
import { getItemByTitle, updateTitle } from "@utils/ScriptureVersionHistory";
import { getScriptureVersionSettings, useScriptureSettings } from "@hooks/useScriptureSettings";

const label = 'Version';
const style = {marginTop: '16px', width: '500px'};

export default function ScriptureCard(Props) {
  const {
    title,
    classes,
  } = Props;

  const { scriptureConfig, setScripture } = useScriptureSettings(Props);

  if (scriptureConfig.title) {
    const title = `${scriptureConfig.title} v${scriptureConfig.version}`
    updateTitle(scriptureConfig.resourceLink, title);
  }

  function getDropDownComponent() {
    const scriptureConfig_ = {...scriptureConfig};
    scriptureConfig_.content = !!scriptureConfig.content;
    const dropDownConfig = getScriptureVersionSettings({
      label,
      resourceLink: scriptureConfig.resourceLink,
      style
    });

    const onChangeOrig = dropDownConfig.onChange;
    dropDownConfig.onChangeOrig = onChangeOrig;
    dropDownConfig.onChange = (title, index) => {

      if (onChangeOrig) {
        onChangeOrig(title, index);
        const item = getItemByTitle(title);
        if (item) {
          setScripture(item);
        }
      }
    }

    return <ComboBox {...dropDownConfig} />;
  }

  const language = getLanguage({ languageId: scriptureConfig?.resource?.languageId });
  const direction = (language?.direction) || 'ltr';

  const items = null
  const {
    state: { headers, filters, fontSize, itemIndex, markdownView },
    actions: { setFilters, setFontSize, setItemIndex, setMarkdownView },
  } = useCardState({
    items,
  })

  const refStyle = {
    fontFamily: 'Noto Sans',
    fontSize: `${Math.round(fontSize * 0.9)}%`,
  }

  const contentStyle = {
    fontFamily: 'Noto Sans',
    fontSize: `${fontSize}%`,
  }

  return (
    <Card
      title={title}
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
      hideMarkdownToggle
      getCustomComponent={getDropDownComponent}
    >
      <ScripturePane
        refStyle={refStyle}
        contentStyle={contentStyle}
        {...scriptureConfig}
        direction={direction}
      />
    </Card>
  )
}

ScriptureCard.propTypes = {
  /** scripture card number (0 to 2 for example) */
  cardNum: PropTypes.number.isRequired,
  /** title for scripture card */
  title: PropTypes.string.isRequired,
  /** current chapter number */
  chapter: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  /** current verse number */
  verse: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  /** server (e.g. 'https://git.door43.org') */
  server: PropTypes.string.isRequired,
  /** repo owner such as unfoldingWord */
  owner: PropTypes.string.isRequired,
  /** repo branch such as master */
  branch: PropTypes.string.isRequired,
  /** resource language to use */
  languageId: PropTypes.string.isRequired,
  /** bookID to use */
  bookId: PropTypes.string.isRequired,
  /** resourceId to use (e.g. ugnt) */
  resourceId: PropTypes.string.isRequired,
  /** if true then word data hover is shown */
  disableWordPopover: PropTypes.bool
}
