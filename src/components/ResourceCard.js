import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  useContent,
  CardContent,
  ERROR_STATE,
  useCardState,
  useTsvMerger,
  useUserBranch,
  MANIFEST_NOT_LOADED_ERROR,
} from 'translation-helps-rcl'
import { useEdit } from 'gitea-react-toolkit'
import { getResourceErrorMessage } from 'single-scripture-rcl'
import { getResourceMessage } from '@utils/resources'
import { RESOURCE_HTTP_CONFIG, SERVER_MAX_WAIT_TIME_RETRY } from '@common/constants'
import generateEditFilePath from '@utils/generateEditFilePath'
import getSha from '@utils/getSha'
export default function ResourceCard({
  id,
  title,
  verse,
  owner,
  server,
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
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(true)
  const cardResourceId = (resourceId === 'twl') && (viewMode === 'markdown') ? 'tw' : resourceId

  // If content changes then set whether it's saved or not.
  useEffect(() => {
    if (content) {
      setSaved(false)
    } else {
      setSaved(true)
    }
  }, [content])

  const {
    state: {
      listRef,
      contentRef,
      usingUserBranch,
      workingResourceBranch,
    },
    actions: { startEdit },
  } = useUserBranch({
    owner,
    server,
    appRef,
    languageId,
    cardId: id,
    loggedInUser,
    authentication,
    cardResourceId,
    onResourceError,
    useUserLocalStorage,
  })

  const {
    tsvs,
    items,
    markdown,
    resource,
    fetchResponse,
    resourceStatus,
    reloadResource,
  } = useContent({
    verse,
    owner,
    server,
    chapter,
    listRef,
    filePath,
    viewMode,
    projectId,
    contentRef,
    languageId,
    resourceId,
    loggedInUser,
    onResourceError,
    useUserLocalStorage,
    ref: workingResourceBranch,
    httpConfig: RESOURCE_HTTP_CONFIG,
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

  const sha = getSha({
    item, fetchResponse, cardResourceId,
  })
  const editFilePath = generateEditFilePath({
    item,
    resource,
    filePath,
    projectId,
    cardResourceId,
  })

  const {
    isEditing,
    onSaveEdit,
  } = useEdit({
    sha,
    owner,
    content,
    config: {
      cache: { maxAge: 0 },
      ...authentication?.config,
      token: authentication?.token,
      timeout: SERVER_MAX_WAIT_TIME_RETRY,
    },
    author: loggedInUser,
    token: authentication?.token,
    branch: workingResourceBranch,
    filepath: editFilePath,
    repo: `${languageId}_${cardResourceId}`,
  })

  const { onTsvEdit } = useTsvMerger({
    tsvs,
    verse,
    chapter,
    itemIndex,
    setContent,
  })

  useEffect(() => {
    if (updateTaDetails) {
      const {
        Quote, OrigQuote, Occurrence, SupportReference = null,
      } = item || {}
      updateTaDetails(SupportReference)
      setQuote({
        quote: Quote || OrigQuote,
        occurrence: Occurrence,
        SupportReference,
      })
    }
  }, [item])

  useEffect(() => {
    const error = resourceStatus?.[ERROR_STATE]

    if (error) { // if error was found do callback
      const message = getResourceErrorMessage(resourceStatus) + ` ${owner}/${languageId}/${projectId}/${workingResourceBranch}`
      const isAccessError = resourceStatus[MANIFEST_NOT_LOADED_ERROR]
      onResourceError && onResourceError(message, isAccessError, resourceStatus)
    }
  }, [resourceStatus?.[ERROR_STATE]])

  const message = getResourceMessage(resourceStatus, owner, languageId, resourceId, server, workingResourceBranch)

  async function handleSaveEdit() {
    // Save edit, if succesful trigger resource reload and set saved to true.
    const saveEdit = async (branch) => {
      await onSaveEdit(branch).then((success) => {
        if (success) {
          console.info('Reloading resource')
          reloadResource()
          setSaved(true)
        }
      })
    }

    // If not using user branch create it then save the edit.
    if (!usingUserBranch) {
      await startEdit().then((branch) => saveEdit(branch))
    } else {// Else just save the edit.
      await saveEdit()
    }
  }

  // Add/remove resources to/from the array to enable or disable edit mode.
  const editableResources = ['tw', 'ta', 'tn', 'tq', 'twl']
  const editable = editableResources.includes(cardResourceId)
  console.log({ items })
  // TODO: EDITING an item after the first one and then editing the first one changes the wrong item, wrong item index carry over.
  return (
    <Card
      id={id}
      title={title}
      items={items}
      classes={classes}
      headers={headers}
      filters={filters}
      editable={editable}
      fontSize={fontSize}
      itemIndex={itemIndex}
      setFilters={setFilters}
      setFontSize={setFontSize}
      saved={saved || isEditing}
      onSaveEdit={handleSaveEdit}
      setItemIndex={setItemIndex}
      markdownView={markdownView}
      disableFilters={disableFilters}
      setMarkdownView={setMarkdownView}
      disableNavigation={disableNavigation}
      hideMarkdownToggle={hideMarkdownToggle}
    >
      <CardContent
        id={`${id}_content`}
        item={item}
        items={items}
        filters={filters}
        editable={editable}
        viewMode={viewMode}
        fontSize={fontSize}
        markdown={markdown}
        setQuote={setQuote}
        onEdit={setContent}
        onTsvEdit={onTsvEdit}
        languageId={languageId}
        markdownView={markdownView}
        selectedQuote={selectedQuote}
        errorMessage={isEditing ? 'Saving Resource...' : message || errorMessage}
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
  viewMode: PropTypes.string,
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
  /** optional callback if error loading resource, parameter returned are:
   *    ({string} errorMessage, {boolean} isAccessError, {object} resourceStatus)
   *    isAccessError - is true if this was an error trying to access file and could likely be due to network connection problem
   *    resourceStatus - is object containing details about problems fetching resource */
  onResourceError: PropTypes.func,
  /** default ref for app (e.g. master) */
  appRef: PropTypes.string,
  /** username of the logged in user */
  loggedInUser: PropTypes.string,
  /** user authentication object */
  authentication: PropTypes.object,
}
