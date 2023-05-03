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
  MANIFEST_NOT_LOADED_ERROR,
} from 'translation-helps-rcl'
import { useEdit } from 'gitea-react-toolkit'
import { MdUpdate, MdUpdateDisabled } from 'react-icons/md'
import { FiShare } from 'react-icons/fi'
import { getResourceErrorMessage } from 'single-scripture-rcl'
import { getResourceMessage } from '@utils/resources'
import { RESOURCE_HTTP_CONFIG, SERVER_MAX_WAIT_TIME_RETRY } from '@common/constants'
import generateEditFilePath from '@utils/generateEditFilePath'
import getSha from '@utils/getSha'
import { StoreContext } from '@context/StoreContext'
import { useContentUpdateProps } from '@hooks/useContentUpdateProps'
import { IconButton } from '@mui/material'
import UpdateBranchButton from '@components/UpdateBranchButton'
import ErrorDialog from '@components/ErrorDialog'


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
  setCurrentCheck,
  viewMode,
  projectId,
  languageId,
  resourceId,
  onMinimize,
  errorMessage,
  loggedInUser,
  selectedQuote,
  disableFilters,
  authentication,
  updateTaDetails,
  onResourceError,
  setSavedChanges,
  disableNavigation,
  hideMarkdownToggle,
  useUserLocalStorage,
  showSaveChangesPrompt,
}) {
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(true)
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

  const repo = `${languageId}_${cardResourceId}`
  const _useBranchMerger = useBranchMerger({ server, owner, repo, userBranch: userEditBranchName, tokenid: authentication?.token?.sha1 });
  const {
    state: {
      mergeStatus: mergeToMaster,
      updateStatus: mergeFromMaster,
    },
    actions: {
      updateUserBranch: mergeFromMasterIntoUserBranch,
      mergeMasterBranch: mergeToMasterFromUserBranch
    }
  } = _useBranchMerger;

  const updateButtonProps = useContentUpdateProps({ isSaving, useBranchMerger: _useBranchMerger, reloadContent: reloadResource });
  const {
    isErrorDialogOpen,
    onCloseErrorDialog,
    isLoading,
    dialogMessage,
    dialogTitle,
    dialogLink,
    dialogLinkTooltip
  } = updateButtonProps;


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
    setContent: updateTempContent,
  })

  const { actions: { updateMergeState } } = useContext(StoreContext)

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
    setIsSaving(true)
    const saveEdit = async (branch) => {
      await onSaveEdit(branch).then((success) => {
        if (success) {
          console.info('Reloading resource')
          reloadResource()
          setSaved(true)
          setSavedChanges(cardResourceId, true)
        } else {
          setSavedChanges(cardResourceId, false)
        }
        setIsSaving(false)
      })
    }

    // If not using user branch create it then save the edit.
    if (!usingUserBranch) {
      await startEdit().then((branch) => saveEdit(branch))
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

    // TODO 399: Remove these checks since we will always display button.
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
      setContent={setContent}
      setFontSize={setFontSize}
      saved={saved || isEditing}
      onSaveEdit={handleSaveEdit}
      setItemIndex={setItemIndex}
      markdownView={markdownView}
      disableFilters={disableFilters}
      cardResourceId={cardResourceId}
      setMarkdownView={setMarkdownView}
      disableNavigation={disableNavigation}
      hideMarkdownToggle={hideMarkdownToggle}
      showSaveChangesPrompt={showSaveChangesPrompt}
      onMinimize={onMinimize ? () => onMinimize(id) : null}
      onRenderToolbar={onRenderToolbar}
    >
      <CardContent
        id={`${id}_content`}
        item={item}
        items={items}
        filters={filters}
        editable={editable}
        viewMode={viewMode}
        fontSize={fontSize}
        setCurrentCheck={setCurrentCheck}
        onTsvEdit={onTsvEdit}
        languageId={languageId}
        setContent={setContent}
        onEdit={updateTempContent}
        markdownView={markdownView}
        selectedQuote={selectedQuote}
        cardResourceId={cardResourceId}
        updateTaDetails={updateTaDetails}
        showSaveChangesPrompt={showSaveChangesPrompt}
        errorMessage={_message}
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
