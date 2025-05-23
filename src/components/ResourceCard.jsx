import React, {
  useContext,
  useEffect,
  useState,
} from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  CardContent,
  ErrorDialog,
  ERROR_STATE,
  MANIFEST_NOT_LOADED_ERROR,
  UpdateBranchButton,
  useBranchMerger,
  useCardState,
  useContent,
  useContentUpdateProps,
  useMasterMergeProps,
  useUserBranch,
} from 'translation-helps-rcl'
import {
  tsvRowUtils,
  tsvDataActions,
  useTsvData,
  useAddTsv,
  AddRowButton,
  AddRowDialog,
  AddRowForm,
  DeleteRowButton,
  DeleteRowDialog
} from 'scripture-tsv'
const { getChapterVerse } = tsvRowUtils
const { tsvsObjectToFileString } = tsvDataActions
import { useEdit } from 'gitea-react-toolkit'
import { getResourceErrorMessage } from 'single-scripture-rcl'
import isEqual from 'deep-equal'
import { getResourceMessage } from '@utils/resources'
import {
  HTTP_CONFIG,
  RESOURCE_HTTP_CONFIG,
  SERVER_MAX_WAIT_TIME_RETRY,
} from '@common/constants'
import generateEditFilePath from '@utils/generateEditFilePath'
import getSha from '@utils/getSha'
import { StoreContext } from '@context/StoreContext'
import { delay } from '../utils/resources'


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
  const [savedContent, setSavedContent] = useState('');
  const [saved, setSaved] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTsvDeleteDialogOpen, setIsTsvDeleteDialogOpen] = useState(false)
  const [fetchConfig, setFetchConfig] = useState({
    basicReference,
    config: HTTP_CONFIG,
    readyToFetch: false,
  })

  const userLocalStorage =
    useUserLocalStorage?.(`markdownView${id}`, true) || undefined

  const markdownViewState = useState(true)

  const [markdownView, setMarkdownView] = userLocalStorage ?? markdownViewState

  const cardResourceId = (resourceId === 'twl') && (viewMode === 'markdown') ? 'tw' : resourceId
  const isResourceTsv = ['tn', 'tq', 'twl'].includes(cardResourceId)
  const isObs = projectId === 'obs'

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
      finishEdit,
      startEdit,
    },
  } = useUserBranch({
    appRef,
    authentication,
    cardId: id,
    cardResourceId,
    isObs,
    languageId,
    loggedInUser,
    onResourceError,
    owner,
    server,
    useUserLocalStorage,
  })

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
    resourceId,
    server,
    useUserLocalStorage,
    verse: _reference?.verse,
    viewMode,
  })

  useEffect(() => {
    if (!savedContent && fetchResponse) {
      const base64Decoded = atob(fetchResponse.data.content)
      const utf8DecodedArray = new Uint8Array(
        base64Decoded.split('').map(char => char.charCodeAt(0))
      )
      const decoder = new TextDecoder()
      const finalString = decoder.decode(utf8DecodedArray)
      setSavedContent(finalString)
    }
  }, [fetchResponse, savedContent])

  const repo = `${languageId}_${cardResourceId}`
  const _useBranchMerger = useBranchMerger({ server, owner, repo, userBranch: branchDetermined ? userEditBranchName : undefined, tokenid: authentication?.token?.sha1 });

  const {
    state: {
      mergeStatus: mergeToMaster,
      updateStatus: mergeFromMaster,
    },
  } = _useBranchMerger;

  const updateButtonProps = useContentUpdateProps({
    isSaving,
    useBranchMerger: _useBranchMerger,
    onUpdate: () => {
      delay(500).then(() => reloadResource())
    }
  })

  const {
    callUpdateUserBranch,
    isErrorDialogOpen,
    onCloseErrorDialog,
    isLoading: isUpdateLoading,
    dialogMessage,
    dialogTitle,
    dialogLink,
    dialogLinkTooltip
  } = updateButtonProps;

  const onMerge = () => {
    finishEdit()
    delay(500).then(() => {
      reloadResource()
    })
  }

  const { isLoading: isMergeLoading, callMergeUserBranch } = useMasterMergeProps({
    useBranchMerger: _useBranchMerger,
    onMerge,
  })

  useEffect(() => {
    if (isUpdateLoading) {
      setCardsLoadingUpdate(prevCardsLoading => [...prevCardsLoading, cardResourceId])
    } else {
      setCardsLoadingUpdate(prevCardsLoading => prevCardsLoading.filter(cardId => cardId !== cardResourceId))
    }
  }, [isUpdateLoading])

  useEffect(() => {
    if (isMergeLoading) {
      setCardsLoadingMerge(prevCardsLoading => [...prevCardsLoading, cardResourceId])
    } else {
      setCardsLoadingMerge(prevCardsLoading => prevCardsLoading.filter(cardId => cardId !== cardResourceId))
    }
  }, [isMergeLoading])

  useEffect(() => {
    if (cardResourceId) {
      updateMergeState(
        cardResourceId,
        title,
        mergeFromMaster,
        mergeToMaster,
        callUpdateUserBranch,
        callMergeUserBranch,
      )
    }
  },[cardResourceId, mergeFromMaster, mergeToMaster])

  const {
    state: {
      item, headers, filters, fontSize, itemIndex,
    },
    actions: {
      setFilters, setFontSize, setItemIndex, setItemIndexPure,
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
      console.warn(`ResourceCard() saveError`, { saveError, isSaveError })
      console.log(`save error`, saveError)
      onResourceError && onResourceError(null, false, null, `Error saving ${languageId}_${cardResourceId} ${saveError}`, true)
    }
  }, [saveError, isSaveError])

  const {
    state: {
      bibleReference: {
        bookId,
      },
    },
    actions: {
      updateMergeState,
      setCardsSaving,
      setCardsLoadingUpdate,
      setCardsLoadingMerge,
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
      console.warn(`ResourceCard() resourceStatus error`, { resourceStatus })
      const message = getResourceErrorMessage(resourceStatus) + ` ${owner}/${languageId}/${projectId}/${workingResourceBranch}`
      const isAccessError = resourceStatus[MANIFEST_NOT_LOADED_ERROR]
      onResourceError && onResourceError(message, isAccessError, resourceStatus)
    }
  }, [resourceStatus?.[ERROR_STATE]])

  const message = getResourceMessage(resourceStatus, owner, languageId, resourceId, server, workingResourceBranch)

  async function handleSaveEdit(newContent = '') {
    // Save edit, if successful trigger resource reload and set saved to true.
    setIsSaving(true) && setCardsSaving(prevCardsSaving => [...prevCardsSaving, cardResourceId])
    const saveEdit = async (branch, newContent) => {
      console.log(`handleSaveEdit() saving edit branch`, { sha, resource })
      const success = await onSaveEdit(branch, newContent)

      if (success) {
        setSaved(true)
        setSavedChanges(cardResourceId, true)
        console.log('setting saved content', content);
        setSavedContent(content);
        delay(500).then(() => {
          console.info('handleSaveEdit() Reloading resource')
          reloadResource()
        })
      } else {
        console.warn(`handleSaveEdit() failed to save edit branch`, { sha, resource })
        const message =
          getResourceErrorMessage(resourceStatus) +
          ` ${owner}/${languageId}/${projectId}/${workingResourceBranch}`
        const isAccessError = resourceStatus[MANIFEST_NOT_LOADED_ERROR]
        onResourceError &&
          onResourceError(message, isAccessError, resourceStatus)
      }
      setIsSaving(false) && setCardsSaving(prevCardsSaving => prevCardsSaving.filter(cardId => cardId !== cardResourceId))
    }

    // If not using user branch create it then save the edit.
    if (!usingUserBranch) {
      console.log(`handleSaveEdit() creating edit branch`, { sha, resource })
      const branch = await startEdit()

      if (branch) {
        saveEdit(branch, newContent)
      } else { // if error on branch creation
        console.warn(`ResourceCard() handleSaveEdit() error creating edit branch`, { sha, resource })
        onResourceError && onResourceError(null, false, null, `Error creating edit branch ${languageId}_${resourceId}`, true)
      }
    } else {// Else just save the edit.
      await saveEdit(null, newContent)
    }
  }

  const columnsFilter = ['Reference', 'Chapter', 'Verse', 'SupportReference'];

  /**
   * Adds a row to a TSV (Tab-Separated Values) data set.
   *
   * @param {Object} row - The row to be added. Must contain a 'Reference' field formatted as 'chapter:verse'.
   *
   * @throws {Error} Throws an error if the 'Reference' field is not in the correct 'chapter:verse' format.
   *
   * @todo Consider adding more validation for TSV properties as currently since it's quite generic.
   */
  const addRowToTsv = row => {
    const { Reference: reference } = row

    try {
      const { chapter: inputChapter, verse: inputVerse } =
        getChapterVerse(reference)

      const isNewRowInDifferentRef = inputChapter !== Number(chapter) || inputVerse !== Number(verse)
      const newTsvs = isNewRowInDifferentRef
        ? onTsvAdd(row, inputChapter, inputVerse, bookId, 0)
        : onTsvAdd(row, chapter, verse, bookId, itemIndex)

      handleSaveEdit(tsvsObjectToFileString(newTsvs))

      if (items.length) setItemIndexPure(itemIndex + 1)
    } catch (error) {
      console.error(
        'Input reference in new row is not of type chapter:verse',
        error
      )
    }
  }

  const deleteTsvRow = () => {
    const newTsvs = onTsvDelete(itemIndex)
    handleSaveEdit(tsvsObjectToFileString(newTsvs))
    setIsTsvDeleteDialogOpen(false)
    if (itemIndex !== 0) setItemIndexPure(itemIndex - 1)
  }

  const { getTsvRow, onTsvAdd, onTsvDelete, onTsvEdit } = isResourceTsv
    ? useTsvData({ tsvs, verse, chapter, itemIndex, setContent: updateTempContent })
    : {}

  const {
    isAddRowDialogOpen,
    openAddRowDialog,
    closeAddRowDialog,
    submitRowEdits,
    newRow,
    changeRowValue,
    columnsFilterOptions
  } = isResourceTsv
    ? useAddTsv({ tsvs, chapter, verse, itemIndex, columnsFilter, addRowToTsv })
    : {}

  const TsvForm = isResourceTsv
    ? (
        <AddRowForm
          newRow={newRow}
          changeRowValue={changeRowValue}
          columnsFilterOptions={columnsFilterOptions}
        />
      )
    : null

  const AddTsvButton = isResourceTsv
    ? (
      <>
        <AddRowButton onClick={openAddRowDialog} />
        <AddRowDialog
          open={isAddRowDialogOpen}
          onClose={closeAddRowDialog}
          onSubmit={submitRowEdits}
          tsvForm={TsvForm}
        />
      </>
    )
    : null

  const DeleteTsvButton = isResourceTsv
    ? (
      <>
        <DeleteRowButton onClick={() => setIsTsvDeleteDialogOpen(true)} />
        <DeleteRowDialog
          open={isTsvDeleteDialogOpen}
          onClose={() => setIsTsvDeleteDialogOpen(false)}
          onSubmit={deleteTsvRow}
          currentRow={getTsvRow(itemIndex)}
        />
      </>
    )
    : null

  const TsvAddAndDeleteButtons = <>{AddTsvButton}{DeleteTsvButton}</>

  // Add/Remove resources to/from the array to enable or disable edit mode.
  const editableResources = ['tw', 'ta', 'tn', 'tq', 'twl']
  const editable = editableResources.includes(cardResourceId)

  const onRenderToolbar = ({ items: toolbarItems }) =>
    [...toolbarItems
    , (<>
        <UpdateBranchButton {...updateButtonProps} isLoading={isUpdateLoading || isSaving}/>
        <ErrorDialog title={dialogTitle} content={dialogMessage} open={isErrorDialogOpen} onClose={onCloseErrorDialog} isLoading={ isUpdateLoading || isSaving } link={dialogLink} linkTooltip={dialogLinkTooltip} />
      </>)
    // If no items, only add add button to header for all tsv resources
    // If TSVs, only add button to header if no items. Else will display in table
    , isResourceTsv && !items?.length ? AddTsvButton
      : isResourceTsv && cardResourceId !== 'twl' ? TsvAddAndDeleteButtons
      : (<></>)
    ]


  return (
    <Card
      cardResourceId={cardResourceId}
      classes={classes}
      disableFilters={disableFilters}
      disableNavigation={disableNavigation}
      editable={editable && markdownView}
      filters={filters}
      fontSize={fontSize}
      headers={headers}
      hideMarkdownToggle={hideMarkdownToggle}
      id={id}
      items={items}
      itemIndex={itemIndex}
      markdownView={markdownView}
      onMinimize={onMinimize ? () => onMinimize(id) : null}
      onRenderToolbar={onRenderToolbar}
      onSaveEdit={handleSaveEdit}
      title={title}
      saved={saved || isEditing || savedContent === content}
      setContent={setContent}
      setFilters={setFilters}
      setFontSize={setFontSize}
      setItemIndex={setItemIndex}
      setMarkdownView={setMarkdownView}
      showSaveChangesPrompt={showSaveChangesPrompt}
    >
      <CardContent
        cardResourceId={cardResourceId}
        editable={editable && markdownView}
        errorMessage={
          isEditing ? 'Saving Resource...' : message || errorMessage
        }
        filters={filters}
        fontSize={fontSize}
        id={`${id}_content`}
        item={item}
        items={items}
        languageId={languageId}
        markdown={
          (cardResourceId === 'ta' || cardResourceId === 'tw') &&
          content.length > 0
            ? content
            : markdown
        } // Adding content value to maintain edit changes even when switching between markdown and html views on tA.
        markdownView={markdownView}
        onEdit={updateTempContent}
        onTsvEdit={onTsvEdit}
        twlActionButtons={TsvAddAndDeleteButtons}
        selectedQuote={selectedQuote}
        setContent={setContent}
        setCurrentCheck={setCurrentCheck}
        setItemIndex={setItemIndexPure}
        shouldDisableClick={isAddRowDialogOpen || isTsvDeleteDialogOpen}
        showSaveChangesPrompt={showSaveChangesPrompt}
        updateTaDetails={updateTaDetails}
        viewMode={viewMode}
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