import { useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  CardContent,
  useContent,
  useCardState,
} from 'translation-helps-rcl'

export default function ResourceCard({
  title,
  verse,
  server,
  owner,
  branch,
  chapter,
  classes,
  filePath,
  viewMode,
  projectId,
  languageId,
  resourceId,
  updateTaDetails,
}) {
  const { items, markdown } = useContent({
    verse,
    chapter,
    projectId,
    branch,
    languageId,
    resourceId,
    filePath,
    owner,
    server,
  })

  const {
    state: { item, headers, filters, fontSize, itemIndex, markdownView },
    actions: { setFilters, setFontSize, setItemIndex, setMarkdownView },
  } = useCardState({
    items,
  })

  useEffect(() => {
    if (updateTaDetails) {
      updateTaDetails(item?.SupportReference || null)
    }
  }, [item])

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
      title={title}
    >
      <CardContent
        item={item}
        items={items}
        filters={filters}
        viewMode={viewMode}
        fontSize={fontSize}
        markdown={markdown}
        // isLoading={isLoading}
        languageId={languageId}
        markdownView={markdownView}
      />
    </Card>
  )
}

ResourceCard.propTypes = {
  viewMode: PropTypes.string,
  title: PropTypes.string.isRequired,
  chapter: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  verse: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  server: PropTypes.string.isRequired,
  owner: PropTypes.string.isRequired,
  branch: PropTypes.string.isRequired,
  languageId: PropTypes.string.isRequired,
  resourceId: PropTypes.string.isRequired,
  projectId: PropTypes.string.isRequired,
  updateTaDetails: PropTypes.func,
  filePath: PropTypes.string,
}
