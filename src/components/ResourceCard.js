import { useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  CardContent,
  useContent,
  useCardState,
} from 'translation-helps-rcl'
import { getResourceMessage } from '@utils/resources'

export default function ResourceCard({
  title,
  id,
  verse,
  server,
  owner,
  branch,
  chapter,
  classes,
  filePath,
  setQuote,
  viewMode,
  projectId,
  languageId,
  resourceId,
  errorMessage,
  selectedQuote,
  disableFilters,
  updateTaDetails,
  disableNavigation,
  hideMarkdownToggle,
}) {
  const {
    items,
    markdown,
    resourceStatus,
  } = useContent({
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

  const message = getResourceMessage(resourceStatus, owner, languageId, resourceId, server)

  const {
    state: {
      item, headers, filters, fontSize, itemIndex, markdownView,
    },
    actions: {
      setFilters, setFontSize, setItemIndex, setMarkdownView,
    },
  } = useCardState({
    items,
    verse,
    chapter,
    setQuote,
    projectId,
    selectedQuote,
  })

  useEffect(() => {
    if (updateTaDetails) {
      updateTaDetails(item?.SupportReference || null)
    }
  }, [item])

  return (
    <Card
      title={title}
      id={id}
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
      disableFilters={disableFilters}
      disableNavigation={disableNavigation}
      hideMarkdownToggle={hideMarkdownToggle}
    >
      <CardContent
        item={item}
        id={`${id}_content`}
        items={items}
        filters={filters}
        viewMode={viewMode}
        fontSize={fontSize}
        markdown={markdown}
        setQuote={setQuote}
        languageId={languageId}
        markdownView={markdownView}
        selectedQuote={selectedQuote}
        errorMessage={message || errorMessage}
      />
    </Card>
  )
}

ResourceCard.defaultProps = {
  errorMessage: null,
  title: '',
}

ResourceCard.propTypes = {
  viewMode: PropTypes.string,
  title: PropTypes.oneOfType(PropTypes.string, PropTypes.object),
  id: PropTypes.string,
  chapter: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  verse: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  server: PropTypes.string.isRequired,
  owner: PropTypes.string.isRequired,
  branch: PropTypes.string.isRequired,
  languageId: PropTypes.string.isRequired,
  resourceId: PropTypes.string.isRequired,
  projectId: PropTypes.string.isRequired,
  updateTaDetails: PropTypes.func,
  setQuote: PropTypes.func,
  filePath: PropTypes.string,
  disableFilters: PropTypes.bool,
  disableNavigation: PropTypes.bool,
  hideMarkdownToggle: PropTypes.bool,
  classes: PropTypes.object,
  selectedQuote: PropTypes.object,
  errorMessage: PropTypes.string,
}
