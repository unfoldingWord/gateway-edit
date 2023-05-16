import { useEffect, useState, useContext } from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  useContent,
  CardContent,
  ERROR_STATE,
  useCardState,
  useTsvMerger,
  useUserBranch,
  useBranchMerger,
  UpdateBranchButton,
  ErrorDialog,
  useContentUpdateProps,
  MANIFEST_NOT_LOADED_ERROR,
} from 'translation-helps-rcl'
import { useEdit } from 'gitea-react-toolkit'
import { MdUpdateDisabled } from 'react-icons/md'
import { FiShare } from 'react-icons/fi'
import { getResourceErrorMessage } from 'single-scripture-rcl'
import * as isEqual from 'deep-equal'
import { getResourceMessage } from '@utils/resources'
import {
  HTTP_CONFIG,
  RESOURCE_HTTP_CONFIG,
  SERVER_MAX_WAIT_TIME_RETRY,
} from '@common/constants'
import generateEditFilePath from '@utils/generateEditFilePath'
import getSha from '@utils/getSha'
import { delay } from '../utils/resources'
import { StoreContext } from '@context/StoreContext'
import { IconButton } from '@mui/material'


export default function ResourceCard({
  appRef,
  authentication,
  chapter,
  classes,
  disableFilters,
  disableNavigation,
  errorMessage,
  filePath,
  hideMarkdownToggle,
  id,
  languageId,
  loggedInUser,
  onMinimize,
  onResourceError,
  owner,
  projectId,
  resourceId,
  showSaveChangesPrompt,
  selectedQuote,
  server,
  setCurrentCheck,
  setSavedChanges,
  title,
  updateTaDetails,
  useUserLocalStorage,
  verse,
  viewMode,
}) {
  const basicReference = {
    chapter,
    verse,
    projectId,
  }
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(true)
  const [fetchConfig, setFetchConfig] = useState({
    basicReference,
    config: HTTP_CONFIG,
    readyToFetch: false,
  })
  const [isSaving, setIsSaving] = useState(false)
  const cardResourceId = (resourceId === 'twl') && (viewMode === 'markdown') ? 'tw' : resourceId

  function updateTempContent(c) {
    setContent(c)
    setSavedChanges(cardResourceId, false)
  }

  // If content changes then set whether it's saved or not.
  useEffect(() => {
    if (content) {
      setSaved(false)
    } else {
      setSaved(true)
    }
  }, [content])

  // Useful to clear content and saved state when chapter and verse changes.
  useEffect(() => {
    setContent('')
    setSaved(true)
  }, [chapter, verse, filePath])

  // Useful to clear content when selectedQuote.quote and selectedQuote.occurrence change, so that tw clears the content value on selection.
  useEffect(() => {
    if (cardResourceId == 'tw') {
      setContent('')
    }
  }, [cardResourceId, selectedQuote?.quote, selectedQuote?.occurrence])

  const {
    state: {
      branchDetermined,
      contentRef,
      listRef,
      usingUserBranch,
      userEditBranchName,
      workingResourceBranch,
    },
    actions: {
      startEdit,
    },
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

  useEffect(() => {
    if (cardResourceId) {
      updateMergeState(
        cardResourceId,
        mergeFromMaster,
        mergeToMaster,
        mergeFromMasterIntoUserBranch,
        mergeToMasterFromUserBranch,
      )
    }
  },[cardResourceId, mergeFromMaster, mergeToMaster])

  // update fetch configuration if changed
  useEffect(() => {
    const config = usingUserBranch ? RESOURCE_HTTP_CONFIG : HTTP_CONFIG

    config.noCache = true // force no caching

    const newFetchConfig = {
      reference: basicReference,
      config: config,
      readyToFetch: branchDetermined,
    }

    if (!isEqual(fetchConfig, newFetchConfig)) {
      console.log(`ResourceCard() fetchConfig changed to`, { sha, newFetchConfig })
      setFetchConfig(newFetchConfig)
    }
  }, [basicReference, branchDetermined, usingUserBranch])

  const _reference = fetchConfig?.reference
  const {
    fetchResponse,
    items,
    markdown,
    reloadResource,
    resource,
    resourceStatus,
    tsvs,
  } = useContent({
    chapter: _reference?.chapter,
    contentRef,
    filePath,
    httpConfig: fetchConfig?.config,
    languageId,
    loggedInUser,
    listRef,
    onResourceError,
    owner,
    projectId: _reference?.projectId,
    readyToFetch: fetchConfig?.readyToFetch,
    ref: workingResourceBranch,
    httpConfig: fetchConfig?.config,
  })

  const repo = `${languageId}_${cardResourceId}`
  const _useBranchMerger = useBranchMerger({ server, owner, repo, userBranch: userEditBranchName, tokenid: authentication?.token?.sha1 });
  const {
    state: {
      mergeStatus: mergeToMaster,
      updateStatus: mergeFromMaster,
    },
    actions: {
      mergeMasterBranch: mergeToMasterFromUserBranch
    }
  } = _useBranchMerger;

  const updateButtonProps = useContentUpdateProps({ isSaving, useBranchMerger: _useBranchMerger, reloadContent: reloadResource });
  const {
    callUpdateUserBranch,
    isErrorDialogOpen,
    onCloseErrorDialog,
    isLoading,
    dialogMessage,
    dialogTitle,
    dialogLink,
    dialogLinkTooltip
  } = updateButtonProps;

  useEffect(() => {
    if (isLoading) {
      setCardsLoading(prevCardsLoading => [...prevCardsLoading, cardResourceId])
    } else {
      setCardsLoading(prevCardsLoading => prevCardsLoading.filter(cardId => cardId !== cardResourceId))
    }
  }, [isLoading])

  useEffect(() => {
    if (cardResourceId) {
      updateMergeState(
        cardResourceId,
        mergeFromMaster,
        mergeToMaster,
        callUpdateUserBranch,
        mergeToMasterFromUserBranch,
      )
    }
  },[cardResourceId, mergeFromMaster, mergeToMaster])

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
    setCurrentCheck,
    projectId,
    selectedQuote,
    useUserLocalStorage,
    resourceId: cardResourceId,
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
    error: saveError,
    isError: isSaveError,
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
    dontCreateBranch: true,
  })

  useEffect(() => { // when we get a save saveError
    if (saveError && isSaveError) {
      console.log(`save error`, saveError)
      onResourceError && onResourceError(null, false, null, `Error saving ${languageId}_${cardResourceId} ${saveError}`, true)
    }
  }, [saveError, isSaveError])

  // useEffect(() => {
  //   console.log(`ResourceCard() sha changed to`, { sha, resource })
  // }, [sha])

  const { onTsvEdit } = useTsvMerger({
    tsvs,
    verse,
    chapter,
    itemIndex,
    setContent: updateTempContent,
  })

  // useEffect(() => {
  //   console.log('ResourceCard verse changed', { chapter, verse, projectId })
  // }, [chapter, verse, projectId])

  // useEffect(() => {
  //   console.log('ResourceCard verse changed', { chapter, verse, projectId })
  // }, [chapter, verse, projectId])

  const {
    actions: {
      updateMergeState,
      setCardsSaving,
      setCardsLoading,
    }
  } = useContext(StoreContext)

  useEffect(() => {
    if (updateTaDetails) {
      const {
        Quote, OrigQuote, Occurrence, Reference, SupportReference = null,
      } = item || {}
      updateTaDetails(SupportReference)
      setCurrentCheck({
        quote: Quote || OrigQuote,
        occurrence: Occurrence,
        SupportReference,
        reference: Reference,
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
    // Save edit, if successful trigger resource reload and set saved to true.
    setIsSaving(true) && setCardsSaving(prevCardsSaving => [...prevCardsSaving, cardResourceId])
    const saveEdit = async (branch) => {
      console.log(`handleSaveEdit() saving edit branch`, { sha, resource })
      await onSaveEdit(branch).then((success) => {
        if (success) {
          setSaved(true)
          setSavedChanges(cardResourceId, true)
          delay(500).then(() => {
            console.info('handleSaveEdit() Reloading resource')
            reloadResource()
          })
        }
        setIsSaving(false) && setCardsSaving(prevCardsSaving => prevCardsSaving.filter(cardId => cardId !== cardResourceId))
      })
    }

    // If not using user branch create it then save the edit.
    if (!usingUserBranch) {
      console.log(`handleSaveEdit() creating edit branch`, { sha, resource })
      await startEdit().then(branch => {
        if (branch) {
          saveEdit(branch)
        } else { // if error on branch creation
          onResourceError && onResourceError(null, false, null, `Error creating edit branch ${languageId}_${resourceId}`, true)
        }
      })
    } else {// Else just save the edit.
      await saveEdit()
    }
  }

  // Add/Remove resources to/from the array to enable or disable edit mode.
  const editableResources = ['tw', 'ta', 'tn', 'tq', 'twl']
  const editable = editableResources.includes(cardResourceId)

  const mergeToMasterHasConflicts = mergeToMaster?.conflict
  const mergeToMasterTitle = mergeToMasterHasConflicts ? 'Merge Conflicts for share with master' : 'No merge conflicts for share with master'
  const mergeToMasterColor = mergeToMasterHasConflicts ? 'black' : 'black'

  const onRenderToolbar = ({ items }) => {
    const newItems = [...items]

    newItems.push(
      <>
        <UpdateBranchButton {...updateButtonProps} isLoading={isLoading || isSaving}/>
        <ErrorDialog title={dialogTitle} content={dialogMessage} open={isErrorDialogOpen} onClose={onCloseErrorDialog} isLoading={ isLoading || isSaving } link={dialogLink} linkTooltip={dialogLinkTooltip} />
      </>
    )

    if (mergeToMaster) {
      newItems.push(
        <IconButton
          className={classes.margin}
          key='share-to-master'
          onClick={mergeToMasterFromUserBranch}
          title={mergeToMasterTitle}
          aria-label={mergeToMasterTitle}
          style={{ cursor: 'pointer' }}
        >
          {mergeToMasterHasConflicts ?
            <MdUpdateDisabled id='share-to-master-icon' color={mergeToMasterColor} />
            :
            <FiShare id='share-to-master-icon' color={mergeToMasterColor} />
          }
        </IconButton>
      )
    }
    return newItems
  }

  let _message = isEditing ? 'Saving Resource...' : message || errorMessage

  return (
    <Card
      cardResourceId={cardResourceId}
      classes={classes}
      disableFilters={disableFilters}
      disableNavigation={disableNavigation}
      editable={editable}
      filters={filters}
      fontSize={fontSize}
      headers={headers}
      hideMarkdownToggle={hideMarkdownToggle}
      id={id}
      items={items}
      itemIndex={itemIndex}
      markdownView={markdownView}
      onMinimize={onMinimize ? () => onMinimize(id) : null}
      onSaveEdit={handleSaveEdit}
      title={title}
      saved={saved || isEditing}
      setContent={setContent}
      setFilters={setFilters}
      setFontSize={setFontSize}
      setItemIndex={setItemIndex}
      setMarkdownView={setMarkdownView}
      showSaveChangesPrompt={showSaveChangesPrompt}
      onMinimize={onMinimize ? () => onMinimize(id) : null}
      onRenderToolbar={onRenderToolbar}
    >
      <CardContent
        cardResourceId={cardResourceId}
        editable={editable}
        errorMessage={isEditing ? 'Saving Resource...' : message || errorMessage}
        filters={filters}
        fontSize={fontSize}
        id={`${id}_content`}
        item={item}
        items={items}
        languageId={languageId}
        markdown={(cardResourceId === 'ta' || cardResourceId === 'tw') && content.length > 0 ? content : markdown}// Adding content value to maintain edit changes even when switching between markdown and html views on tA.
        markdownView={markdownView}
        onEdit={updateTempContent}
        onTsvEdit={onTsvEdit}
        selectedQuote={selectedQuote}
        setContent={setContent}
        setCurrentCheck={setCurrentCheck}
        updateTaDetails={updateTaDetails}
        viewMode={viewMode}
        showSaveChangesPrompt={showSaveChangesPrompt}
        errorMessage={isEditing ? 'Saving Resource...' : message || errorMessage}
        markdown={(cardResourceId == 'ta' || cardResourceId == 'tw') && content.length > 0 ? content : markdown}// Adding content value to maintain edit changes even when switching between markdown and html views on tA.
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
  setCurrentCheck: PropTypes.func,
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
  /** Set whether changes are saved or not so that the saved changes prompts opens when necessary. */
  setSavedChanges: PropTypes.func,
  /** Shows a unsaved changes prompt if there's any. */
  showSaveChangesPrompt: PropTypes.func,
  /** function to minimize the card (optional) */
  onMinimize: PropTypes.func,
}
