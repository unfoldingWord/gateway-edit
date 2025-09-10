/**
 * WordAlignerDialog Component
 *
 * ## Synopsis
 * A modal dialog component that provides an interactive interface for aligning words between source and target Bible texts.
 * The dialog is draggable and integrates with machine learning-based alignment suggestions to assist users in creating
 * accurate word alignments for translation work.
 *
 * ## Description
 * The WordAlignerArea serves as a specialized tool for Bible translation teams to create and manage word alignments
 *   between original language texts (Hebrew/Greek) and target language translations. It features:
 *   It uses WordAlignerArea Component to render dialog content and uses useAlignmentSuggestions for alignment suggestions
 *
 * - **Draggable Interface**: Users can reposition the dialog within the workspace bounds
 * - **AI-Powered Suggestions**: Integrates with enhanced-word-aligner-rcl for intelligent alignment recommendations
 * - **Training System**: Supports both cached and on-demand training of alignment models using translation memory
 * - **Real-time Updates**: Monitors alignment status changes and updates the interface accordingly
 * - **Error Handling**: Displays error messages and handles training failures gracefully
 * - **Performance Optimization**: Uses React.memo with custom comparison to prevent unnecessary re-renders
 *
 * ## Properties
 * @param {Object} alignerStatus - Status object containing alignment data, reference information, and control actions
 * @param {number} height - Maximum height constraint for the dialog content area (required)
 * @param {Function} translate - Translation function for UI text localization (required)
 * @param {Function} getLexiconData - Function to fetch lexicon data for words (required)
 * @param {string} originalBibleBookUsfm - USFM content of the original language Bible book
 * @param {string} owner - Repository owner identifier for the target Bible
 *
 * ## Requirements
 * - React 16.8+ (uses hooks extensively)
 * - Material-UI Dialog component
 * - react-draggable for drag functionality
 * - translation-helps-rcl for bounds management
 * - enhanced-word-aligner-rcl for alignment suggestions and training
 * - Web Worker support for background training processes
 * - StoreContext for accessing workspace references
 */

import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react'
import PropTypes from 'prop-types'
import Dialog from '@mui/material/Dialog'
import Paper from '@mui/material/Paper'
import Draggable from 'react-draggable'
import { useBoundsUpdater } from 'translation-helps-rcl'
import isEqual from 'deep-equal'
import { AlignmentTrainerUtils } from 'enhanced-word-aligner-rcl'
import { StoreContext } from '@context/StoreContext'
import WordAlignerArea from './WordAlignerArea';

function getBookData(alignerStatus) {
  return alignerStatus?.state?.reference || {};
}

// popup dialog for user to align verse
function WordAlignerDialog({
  alignerStatus,
  height,
  translate,
  getLexiconData,
  originalBibleBookUsfm,
  owner
}) {
  const [state, setState] = useState({
    showDialog: false,
    contextId: null,
    targetWords: [],
    verseAlignments: [],
    targetLanguage: {},
    sourceLanguageId: '',
    errorMessage: '',
    title: ''
  });

  const dialogRef = useRef(null); // for keeping track of aligner dialog position
  const handleSetTrainingState = useRef(null);

  const {
    showDialog,
    contextId,
    targetWords,
    verseAlignments,
    targetLanguage,
    sourceLanguageId,
    errorMessage,
    title
  } = state;

  const {
    state: {
      mainScreenRef,
    },
  } = useContext(StoreContext)

  useEffect(() => {
    console.log('WordAlignerDialog initialized/mounted')
    // Cleanup function that runs on unmount
    return () => {
      console.log('WordAlignerDialog unmounted')
    };
  }, []);

  const currentInstance = dialogRef?.current;
  const alignerData_ = alignerStatus?.state?.alignerData;
  const targetWords_ = alignerData_?.wordBank || null
  const verseAlignments_ = alignerData_?.alignments || null
  const shouldShowDialog_ = !!(targetWords_ && verseAlignments_)

  const boundsParams = useMemo(() => {
    console.log(`WordAlignerDialog: shouldShowDialog_ changed to ${shouldShowDialog_}`)

    return { // keeps track of drag bounds
      workspaceRef: mainScreenRef,
      cardRef: dialogRef,
      open: !!shouldShowDialog_,
      displayState: {
        showDialog: shouldShowDialog_
      },
    }
  }, [shouldShowDialog_]);

  const {
    state: { bounds },
    actions: { doUpdateBounds },
  } = useBoundsUpdater(boundsParams)

  useEffect(() => {
    console.log('WordAlignerDialog: boundsParams changed')
  }, [boundsParams])

  useEffect(() => { // monitor changes in alignment dialog position and open state
    if (alignerData_ &&
      currentInstance?.clientWidth &&
      currentInstance?.clientHeight) {
      console.log('WordAlignerDialog: updating bounds')
      doUpdateBounds()
    }
  }, [currentInstance, alignerData_])

  function PaperComponent(props) { // contains the word aligner dialog
    return (
      <Draggable
        handle="#draggable-aligner-dialog-title"
        cancel={'[class*="MuiDialogContent-root"]'}
        bounds={bounds}
      >
        <Paper
          {...props}
          ref={dialogRef}
        />
      </Draggable>
    )
  }

  const bookId = contextId?.reference?.bookId || ''

  const targetBibleBookUsfm = alignerData_?.bibleUsfm || ''
  const translationMemory = useMemo(() => (
    AlignmentTrainerUtils.makeTranslationMemory(bookId, originalBibleBookUsfm, targetBibleBookUsfm)
  ), [bookId, originalBibleBookUsfm, targetBibleBookUsfm]);

  const getContextId = (alignerStatus) => {
    const reference = alignerStatus?.state?.reference;

    if (reference) {
      const alignerData = alignerStatus?.state?.alignerData || null
      const targetRef = alignerData?.resourceLink || ''
      let [ owner_, repoLanguageId, repoBibleId ] = targetRef.split('/')
      owner_ = owner_ || owner;
      const bibleId = owner_ && repoLanguageId && repoBibleId ? `${owner}/${repoLanguageId}/${repoBibleId}` : '';

      let newContextId = null;

      if (targetRef && reference?.bookId) {
        newContextId = {
          reference: alignerStatus?.state?.reference,
          bibleId,
          tool: 'wordAlignment'
        };
      }
      console.log('WordAlignerDialog: getContextId', newContextId)
      return newContextId;
    }
    return null;
  }

  const alignmentActions = alignerStatus?.actions;

  const alignmentActions_ = useMemo(() => {
    console.log('WordAlignerDialog: updated alignmentActions_');
    return {
      cancelAlignment: () => alignmentActions?.cancelAlignment(),
      saveAlignment: (alignmentChange) => alignmentActions?.saveAlignment(alignmentChange)
    }
  }, [alignmentActions]);

  useEffect(() => {
    console.log('WordAlignerDialog: updated alignmentActions_');
  }, [alignmentActions]);

  function getTitle(alignerStatus) {
    const {
      bookId,
      chapter,
      verse,
    } = getBookData(alignerStatus)

    const title_ = `${bookId?.toUpperCase()} ${chapter}:${verse} in ${alignerStatus?.state?.title}`
    return title_;
  }

  useEffect(() => {
    if (shouldShowDialog_ !== showDialog) {
      console.log(`WordAlignerDialog: alignment data changed shouldShowDialog_ ${shouldShowDialog_}`)

      const sourceLanguageId_ = alignerStatus?.state?.sourceLanguage || ''
      const targetLanguage_ = alignerStatus?.state?.targetLanguage || null
      const errorMessage_ = alignerStatus?.state?.errorMessage
      const title_ = getTitle(alignerStatus);
      const contextId_ = shouldShowDialog_ ? getContextId(alignerStatus) : null

      setState(prevState => ({
        ...prevState,
        showDialog: shouldShowDialog_,
        sourceLanguageId: sourceLanguageId_,
        targetLanguage: targetLanguage_,
        errorMessage: errorMessage_,
        title: title_,
        contextId: contextId_
      }));
    }

    const changedTW = !isEqual(targetWords, targetWords_);
    const changedVA = !isEqual(verseAlignments, verseAlignments_);

    if (changedTW || changedVA) {
      console.log(`WordAlignerDialog: alignment data changed - changedTW ${changedTW}, changedVA ${changedVA}`)
      setState(prevState => ({
        ...prevState,
        targetWords: targetWords_,
        verseAlignments: verseAlignments_
      }));
    } else {
      console.log('WordAlignerDialog alignerStatus changed yet wordbank and alignments are not difference')
    }
  }, [targetWords_, verseAlignments_, alignerData_?.state?.reference, shouldShowDialog_]);

  const wordAlignerDialogArea = useMemo(() => {
    console.log('WordAlignerDialog: wordAlignerDialogArea regenerated')

    return (
      <Dialog
        fullWidth={true}
        maxWidth={'lg'}
        onClose={() => {}}
        open={!!showDialog}
        PaperComponent={PaperComponent}
        bounds={bounds}
        aria-labelledby="draggable-aligner-dialog-title"
      >
        <WordAlignerArea
          alignmentActions={alignmentActions_}
          contextId={contextId}
          errorMessage={errorMessage}
          lexiconCache={{}}
          loadLexiconEntry={getLexiconData}
          showingDialog={!!showDialog}
          sourceLanguageId={sourceLanguageId}
          height={height}
          targetLanguage={targetLanguage}
          targetLanguageFont={''}
          targetWords={targetWords}
          title={title || ''}
          translate={translate}
          translationMemory={translationMemory}
          verseAlignments={verseAlignments}
        />
      </Dialog>
    )
  },
  [
    contextId,
    errorMessage,
    showDialog,
    sourceLanguageId,
    targetLanguage,
    targetWords,
    title,
    verseAlignments
  ]
  );

  return (
    <>
      {wordAlignerDialogArea}
    </>
  )
}

WordAlignerDialog.propTypes = {
  alignerStatus: PropTypes.object,
  height: PropTypes.number.isRequired,
  translate: PropTypes.func.isRequired,
  getLexiconData: PropTypes.func.isRequired,
  originalBibleBookUsfm: PropTypes.string,
  owner: PropTypes.string,
}

export default React.memo(WordAlignerDialog, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  const keysToCompare = [
    'alignerStatus',
    'height',
    'originalBibleBookUsfm',
    'owner'
  ];

  // Track what changed in memo comparison
  const changedProps = {};

  function getAlignmentData(alignerStatus) {
    const alignerData_ = alignerStatus?.state?.alignerData;
    const targetWords = alignerData_?.wordBank || null
    const verseAlignments = alignerData_?.alignments || null
    return {targetWords, verseAlignments};
  }

  const previousAlignmentData = getAlignmentData(prevProps.alignerStatus);
  const nextAlignmentData = getAlignmentData(nextProps.alignerStatus);

  if (!isEqual(previousAlignmentData, nextAlignmentData)) {
    // console.log('WordAlignerDialog React.memo: prop changed alignerStatus', {previousAlignmentData, nextAlignmentData})
    changedProps.alignerStatus = { from: previousAlignmentData, to: nextAlignmentData };
  }

  // Simple comparison for other props
  for (let key of keysToCompare.slice(1)) {
    if (prevProps[key] !== nextProps[key]) {
      // console.log('WordAlignerDialog React.memo: prop changed', {key, from: prevProps[key], to: nextProps[key]})
      changedProps[key] = { from: prevProps[key], to: nextProps[key] };
    }
  }

  // Functions should be stable, but check reference equality
  if (prevProps.translate !== nextProps.translate) {
    // console.log('WordAlignerDialog React.memo: translate function changed');
    changedProps.translate = 'function reference changed';
  }

  if (prevProps.getLexiconData !== nextProps.getLexiconData) {
    // console.log('WordAlignerDialog React.memo: getLexiconData function changed');
    changedProps.getLexiconData = 'function reference changed';
  }

  const hasChanges = Object.keys(changedProps).length > 0;

  if (hasChanges) {
    console.log('WordAlignerDialog React.memo: Changed props summary:', changedProps);
    return false; // Props changed, re-render
  }

  // console.log('WordAlignerDialog React.memo: No props changed, skipping re-render');
  return true; // Props are the same, skip re-render
});
