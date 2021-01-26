import { useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  CardContent,
  useContent,
  useCardState,
} from 'translation-helps-rcl'
import { ScripturePane, useScripture } from 'single-scripture-rcl'
import { getLanguage } from '@common/languages'

export default function ScriptureCard({
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
  disableWordPopover,
}) {
  const scriptureConfig = useScripture({
    reference: {
      projectId: bookId,
      chapter,
      verse,
    },
    resource: {
      languageId,
      projectId: resourceId,
      owner,
      branch,
    },
    config: {
      server,
      cache: { maxAge: 1 * 1 * 1 * 60 * 1000 },
    },
    disableWordPopover,
  })

  const language = getLanguage({ languageId })
  const direction = language?.direction || 'ltr'

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

  console.log({ scriptureConfig })
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
      disableMarkdownToggle
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
  title: PropTypes.string.isRequired,
  chapter: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  verse: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  server: PropTypes.string.isRequired,
  owner: PropTypes.string.isRequired,
  branch: PropTypes.string.isRequired,
  languageId: PropTypes.string.isRequired,
  bookId: PropTypes.string.isRequired,
  resourceId: PropTypes.string.isRequired,
  disableWordPopover: PropTypes.bool,
}
