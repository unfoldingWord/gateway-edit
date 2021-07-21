import path from 'path'
import { useEffect , useState } from 'react'
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
import { HTTP_CONFIG } from '@common/constants'
import { useEdit } from 'gitea-react-toolkit'


export default function ResourceCard({
  id,
  title,
  verse,
  server,
  owner,
  appRef,
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
  authentication,
  loggedInUser,
}) {
  const branch = resourceId == 'ta' ? `${loggedInUser}-tc-create-1` : appRef
  const [content, setContent] = useState('')
  // TODO blm: in future will need to implement way in app to change ref of specific resource
  const [ref, setRef] = useUserLocalStorage(`${id}_ref`, branch) // initialize to default for app
  const {
    items,
    markdown,
    fetchResponse,
    resourceStatus,
  } = useContent({
    ref: branch,
    verse,
    owner,
    server,
    chapter,
    filePath,
    projectId,
    languageId,
    resourceId,
    onResourceError,
    httpConfig: HTTP_CONFIG,
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

  const sha = item?.fetchResponse?.data?.sha || fetchResponse?.data?.sha || null
  console.log('content', content)
  console.log('fetchResponse?.data?.sha', fetchResponse?.data?.sha)
  console.log('item?.fetchResponse?.data?.sha', item?.fetchResponse?.data?.sha)
  console.log('fetchResponse', fetchResponse)
  console.log('sha', sha)
  console.log('item', item)
  console.log('items', items)
  console.log('resourceId', resourceId)
  console.log('filePath', filePath)
  console.log('projectId', projectId)

  const {
    error,
    isError,
    isEditing,
    onSaveEdit,
    editResponse,
  } = useEdit({
    sha,
    owner,
    content,
    token: authentication?.token,
    branch,
    author: loggedInUser,
    config: {
      ...authentication?.config,
      token: authentication?.token,
    },
    filepath: item?.filePath || (projectId && filePath ? path.join(projectId, filePath) : null),
    repo: `${languageId}_${viewMode === 'markdown' ? 'tw' : resourceId}`,
  })

  console.table({
    error,
    isError,
    isEditing,
    onSaveEdit,
    editResponse,
  })

  useEffect(() => {
    if (updateTaDetails) {
      updateTaDetails(item?.SupportReference || null)
    }
  }, [item])

  useEffect(() => {
    const error = resourceStatus?.[ERROR_STATE]

    if (error) { // if error was found do callback
      const message = getResourceErrorMessage(resourceStatus) + ` ${owner}/${languageId}/${projectId}/${ref}`
      const isAccessError = resourceStatus[MANIFEST_NOT_LOADED_ERROR]
      onResourceError && onResourceError(message, isAccessError, resourceStatus)
    }
  }, [resourceStatus?.[ERROR_STATE]])

  const message = getResourceMessage(resourceStatus, owner, languageId, resourceId, server)

  return (
    <Card
      id={id}
      editable
      title={title}
      items={items}
      classes={classes}
      headers={headers}
      filters={filters}
      fontSize={fontSize}
      itemIndex={itemIndex}
      setFilters={setFilters}
      onSaveEdit={onSaveEdit}
      setFontSize={setFontSize}
      setItemIndex={setItemIndex}
      markdownView={markdownView}
      setMarkdownView={setMarkdownView}
      disableFilters={disableFilters}
      disableNavigation={disableNavigation}
      hideMarkdownToggle={hideMarkdownToggle}
    >
      <CardContent
        editable
        id={`${id}_content`}
        item={item}
        items={items}
        filters={filters}
        viewMode={viewMode}
        fontSize={fontSize}
        markdown={markdown}
        setQuote={setQuote}
        onEdit={(c) => setContent(c)}
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
  id: PropTypes.string,
  appRef: PropTypes.string,
  viewMode: PropTypes.string,
  loggedInUser: PropTypes.string.isRequired,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  chapter: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  verse: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  server: PropTypes.string.isRequired,
  owner: PropTypes.string.isRequired,
  ref: PropTypes.string.isRequired,
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
  authentication: PropTypes.object,
  /** optional callback if error loading resource, parameter returned are:
   *    ({string} errorMessage, {boolean} isAccessError, {object} resourceStatus)
   *    isAccessError - is true if this was an error trying to access file and could likely be due to network connection problem
   *    resourceStatus - is object containing details about problems fetching resource */
  onResourceError: PropTypes.func,
}
