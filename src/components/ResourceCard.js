import { useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  CardContent,
  useContent,
  useCardState,
  ERROR_STATE,
  MANIFEST_NOT_LOADED_ERROR,
} from 'translation-helps-rcl'
import { getResourceMessage } from '@utils/resources'
import { getResourceErrorMessage } from 'single-scripture-rcl'

export default function ResourceCard({
  id,
  title,
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
  useUserLocalStorage,
  onResourceError,
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
    onResourceError,
  })

  const {
    state: {
      item, headers, filters, fontSize, itemIndex, markdownView,
    },
    actions: {
      setFilters, setFontSize, setItemIndex, setMarkdownView,
    },
  } = useCardState({
    id,
    items,
    verse,
    chapter,
    setQuote,
    projectId,
    selectedQuote,
    useUserLocalStorage,
  })

  useEffect(() => {
    if (updateTaDetails) {
      updateTaDetails(item?.SupportReference || null)
    }
  }, [item])

  useEffect(() => {
    const error = resourceStatus?.[ERROR_STATE]

    if (error) { // if error was found do callback
      const message = getResourceErrorMessage(resourceStatus) + ` ${owner}/${languageId}/${projectId}/${branch}`
      const isAccessError = resourceStatus[MANIFEST_NOT_LOADED_ERROR]
      onResourceError && onResourceError(message, isAccessError, resourceStatus)
    }
  }, [resourceStatus?.[ERROR_STATE]])

  const message = getResourceMessage(resourceStatus, owner, languageId, resourceId, server)

  return (
    <Card
      id={id}
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
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
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
  useUserLocalStorage: PropTypes.func,
  /** optional callback if error loading resource, parameter returned are:
   *    ({string} errorMessage, {boolean} isAccessError, {object} resourceStatus)
   *    isAccessError - is true if this was an error trying to access file and could likely be due to network connection problem
   *    resourceStatus - is object containing details about problems fetching resource */
  onResourceError: PropTypes.func,
}
