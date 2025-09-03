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
import { StoreContext } from '@context/StoreContext'
import WordAlignerArea from './WordAlignerArea';
import isEqual from 'deep-equal'
import {AlignmentTrainerUtils, useAlignmentSuggestions} from 'enhanced-word-aligner-rcl'
import {createAlignmentTrainingWorker} from '../workers/startAlignmentTrainer'
import {delay} from '@utils/resources'

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
    autoTrainingCompleted: false,
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
    autoTrainingCompleted,
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
  const translationMemory = useMemo(() => {
    return AlignmentTrainerUtils.makeTranslationMemory(bookId, originalBibleBookUsfm, targetBibleBookUsfm);
  }, [bookId, originalBibleBookUsfm, targetBibleBookUsfm]);

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
          tool: "wordAlignment",
          bibleId
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

  const handleTrainingCompleted = useCallback((info) => {
    console.log("handleTrainingCompleted", info);
  }, []);

  function setHandleSetTrainingState(handleSetTrainingState_) {
    console.log('WordAlignerDialog: setHandleSetTrainingState', handleSetTrainingState_)
    handleSetTrainingState.current = handleSetTrainingState_;
  }

  /**
   * A function that handles updating the training state.
   * TRICKY:  Serves as a forward reference for handleSetTrainingStateSub
   *
   * @function
   * @name handleSetTrainingState_
   * @param {Object} props - The properties or parameters that are passed to determine the training state.
   */
  const handleSetTrainingState_ = (props) => {
    handleSetTrainingStateSub(props)
  }

  const {
    state: {
      failedToLoadCachedTraining,
      trainingRunning,
    },
    actions: {
      areTrainingSameBook,
      cleanupWorker,
      getSuggester,
      getTrainingContextId,
      isTraining,
      loadTranslationMemory,
      startTraining,
      suggester,
    }
  } = useAlignmentSuggestions({
    contextId,
    createAlignmentTrainingWorker,
    handleSetTrainingState: handleSetTrainingState_,
    handleTrainingCompleted,
    shown: showDialog,
    sourceLanguageId: sourceLanguageId,
    targetLanguageId: targetLanguage?.languageId,
    targetUsfm: targetBibleBookUsfm,
    sourceUsfm: originalBibleBookUsfm,
  });

  const handleSetTrainingStateSub = (props) => {
    if (!props) {
      console.log('handleSetTrainingStateSub: no props');
      return;
    }

    const current = handleSetTrainingState.current;
    if (!current) {
      console.log('handleSetTrainingStateSub: no handleSetTrainingState.current');
      return
    }
    const newProps = {
      ...props,
      suggester: getSuggester(), // inject updated suggester
    }

    current?.(newProps)
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

      if (shouldShowDialog_) {
        if (isTraining()) {
          const sameContext = areTrainingSameBook(contextId_)
          const trainingContextId = getTrainingContextId();
          console.log(`WordAlignerDialog: training is running, sameContext is ${sameContext}`)
          if (!sameContext) {
            console.log(`WordAlignerDialog: stopping worker on other book:`, trainingContextId)
            cleanupWorker()
          } else {
            console.log(`WordAlignerDialog: worker running on same book:`, trainingContextId)
          }
        }
      }
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

  const areTrainingSameBook_ = () => {
    const trainingCurrent = areTrainingSameBook(contextId);
    return trainingCurrent;
  }

  // Effect to load translation memory and start training when fail to load cached training Model
  useEffect(() => {
    if (failedToLoadCachedTraining) {
      console.log('WordAlignerArea: failedToLoadCachedTraining', {failedToLoadCachedTraining, contextId, showDialog})
      const haveBook = contextId?.reference?.bookId;
      if (!haveBook) {
        if (autoTrainingCompleted) {
          setState(prevState => ({...prevState, autoTrainingCompleted: false}));
        }
      } else { // have a book, so check if we have cached training data
        if (showDialog) {
          const trainingSameBook = areTrainingSameBook_()
          if (trainingRunning) {
            console.log('WordAlignerArea: training already running trainingSameBook:', trainingSameBook)
          }
          if (!trainingRunning && !autoTrainingCompleted) {
            const targetUsfmsBooks = translationMemory?.targetUsfms;
            const haveCachedTrainingData = targetUsfmsBooks && Object.keys(targetUsfmsBooks).length > 0;
            if (haveCachedTrainingData) {
              console.log('WordAlignerArea: translation memory changed, loading translation memory')
              loadTranslationMemory(translationMemory);
              startTraining();
            }
          }
        }
      }
    }
  }, [failedToLoadCachedTraining]);

  const doTraining = useCallback(() => {
    const training = isTraining()
    console.log(`WordAlignerDialog: doTraining() - currently training is ${training}`)
    if (!training) {
      startTraining();
    }
  }, [showDialog])

  const alignerAreaStyle = useMemo(() => ({
    maxHeight: `${height}px`,
    overflowY: 'auto'
  }), [height]);

  // const oldDependencies = useRef({})

  const wordAlignerDialogArea = useMemo(() => {
    console.log('WordAlignerDialog: wordAlignerDialogArea regenerated')

      // // Track which dependencies caused the useMemo to regenerate
      // const dependencies = {
      //   contextId,
      //   doTraining,
      //   errorMessage,
      //   showDialog,
      //   sourceLanguageId,
      //   targetLanguage,
      //   targetWords,
      //   title,
      //   verseAlignments
      // };
      //
      // for (const key in dependencies) {
      //   if (dependencies.hasOwnProperty(key)) {
      //     const value = dependencies[key];
      //     const oldValue = oldDependencies.current[key];
      //     if (oldValue !== value) {
      //       console.log(`WordAlignerDialog: ${key} changed from '${oldValue}' to '${value}'`);
      //       oldDependencies.current[key] = value;
      //     }
      //   }
      // }

      return <Dialog
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
          doTraining={doTraining}
          errorMessage={errorMessage}
          lexiconCache={{}}
          loadLexiconEntry={getLexiconData}
          removeClear={true}
          setHandleSetTrainingState={setHandleSetTrainingState}
          showingDialog={!!showDialog}
          sourceLanguageId={sourceLanguageId}
          style={alignerAreaStyle}
          suggester={suggester}
          targetLanguage={targetLanguage}
          targetLanguageFont={''}
          targetWords={targetWords}
          title={title || ''}
          translate={translate}
          verseAlignments={verseAlignments}
        />
      </Dialog>
    },
    [
      contextId,
      doTraining,
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
