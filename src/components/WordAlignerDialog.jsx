import React, {
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
import {useAlignmentSuggestions} from "enhanced-word-aligner-rcl";
import {createAlignmentTrainingWorker} from "../workers/startAlignmentTrainer";
import {AlignmentTrainerUtils} from "enhanced-word-aligner-rcl";
import {delay} from "@utils/resources";

// Add this custom hook at the top of the file, after imports
function useWhyDidYouUpdate(name, props) {
  // Get a mutable ref object where we can store props for comparison next time this hook runs.
  const previous = useRef();

  useEffect(() => {
    if (previous.current) {
      // Get all keys from previous and current props
      const allKeys = Object.keys({ ...previous.current, ...props });

      // Use this object to keep track of changed props
      const changedProps = {};

      // Iterate through keys
      allKeys.forEach(key => {
        // If previous is different from current
        if (!isEqual(previous.current[key], props[key])) {
          // Add to changedProps
          changedProps[key] = {
            from: previous.current[key],
            to: props[key]
          };
        }
      });

      // If changedProps not empty then log
      if (Object.keys(changedProps).length) {
        console.log('[why-did-you-update]', name, changedProps);
      }
    }

    // Finally update previous to current for next hook call
    previous.current = props;
  });
}

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
  // Add this hook to track prop changes
  useWhyDidYouUpdate('WordAlignerDialog', {
    alignerStatus,
    height,
    translate,
    getLexiconData,
    originalBibleBookUsfm,
    owner
  });

  const [aligned, setAligned] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [contextId, setContextId] = useState(null)
  const dialogRef = useRef(null) // for keeping track of aligner dialog position
  const [startTraining, setStartTraining] = useState(false); // triggers start of training
  const [autoTrainingCompleted, setAutoTrainingCompleted] = useState(false); // triggers start of training
  const [trained, setTrained] = useState(false);
  const [training, setTraining] = useState(false);
  const [trainingError, setTrainingError] = useState('');

  const [targetWords, setTargetWords] = useState([]);
  const [verseAlignments, setVerseAlignments] = useState([]);
  const [trainingStatusStr, setTrainingStatusStr] = useState('');
  const [trainingButtonStr, setTrainingButtonStr] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [sourceLanguageId, setSourceLanguageId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [title, setTitle] = useState('');

  const {
    state: {
      mainScreenRef,
    },
  } = useContext(StoreContext)

  const boundsParams = useMemo(() => ({ // keeps track of drag bounds
    workspaceRef: mainScreenRef,
    cardRef: dialogRef,
    open: !!showDialog,
    displayState: {
      alignerData: showDialog
    },
  }), [mainScreenRef, dialogRef, showDialog]);

  const {
    state: { bounds },
    actions: { doUpdateBounds },
  } = useBoundsUpdater(boundsParams)

  useEffect(() => {
    console.log('WordAlignerDialog: initialized')
  }, [])

  useEffect(() => {
    console.log('WordAlignerDialog: boundsParams changed')
  }, [boundsParams])

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

  const currentInstance = dialogRef?.current;
  const alignerData_ = alignerStatus?.state?.alignerData;

  useEffect(() => { // monitor changes in alignment dialog position and open state
    if (alignerData_ &&
      currentInstance?.clientWidth &&
      currentInstance?.clientHeight) {
      console.log('WordAlignerDialog: updating bounds')
      doUpdateBounds()
    }
  }, [currentInstance, alignerData_])

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

  useEffect(() => {
    console.log('WordAlignerDialog mounted')
    // Cleanup function that runs on unmount
    return () => {
      console.log('WordAlignerDialog unmounted')
    };
  }, []);

  function getTitle(alignerStatus) {
    const {
      bookId,
      chapter,
      verse,
    } = getBookData(alignerStatus)

    const title_ = `${bookId?.toUpperCase()} ${chapter}:${verse} in ${alignerStatus?.state?.title}`
    return title_;
  }

  const targetWords_ = alignerData_?.wordBank || null
  const verseAlignments_ = alignerData_?.alignments || null
  const shouldShowDialog_ = !!(targetWords_ && verseAlignments_)

  useEffect(() => {
    if (shouldShowDialog_ !== showDialog) {
      console.log(`WordAlignerDialog: alignment data changed shouldShowDialog_ ${shouldShowDialog_}`)
      setShowDialog(shouldShowDialog_)

      const sourceLanguageId_ = alignerStatus?.state?.sourceLanguage || ''
      setSourceLanguageId(sourceLanguageId_)
      const targetLanguage_ = alignerStatus?.state?.targetLanguage || null
      setTargetLanguage(targetLanguage_)

      const errorMessage_ = alignerStatus?.state?.errorMessage
      setErrorMessage(errorMessage_)

      const title_ = getTitle(alignerStatus);
      setTitle(title_)

      const contextId_ = shouldShowDialog_ ? getContextId(alignerStatus) : null
      setContextId(contextId_);
    }

    const changedTW = !isEqual(targetWords, targetWords_);
    const changedVA = !isEqual(verseAlignments, verseAlignments_);

    if (changedTW || changedVA) {
      console.log(`WordAlignerDialog: alignment data changed - changedTW ${changedTW}, changedVA ${changedVA}`)
      setTargetWords(targetWords_)
      setVerseAlignments(verseAlignments_)

    } else {
      console.log('WordAlignerDialog alignerStatus changed yet wordbank and alignments are not difference')
    }
  }, [targetWords_, verseAlignments_, alignerData_?.state?.reference, shouldShowDialog_]);

  const handleSetTrainingState = ({
                                    percentComplete,
                                    training: _training,
                                    trainingComplete,
                                    trainingFailed,
                                  }) => {
    if (_training === undefined) {
      _training = training;
    } else {
      console.log('Updating training state: ' + _training);
    }
    if (trainingComplete === undefined) {
      trainingComplete = trained;
    } else {
      console.log('Updating trainingComplete state: ' + trainingComplete);
    }

    if (_training !== training) {
      setTraining(_training);
    }
    if (!_training && startTraining) {
      setStartTraining(false);
    }
    if (trainingComplete !== trained) {
      setTrained(trainingComplete);
    }
    let trainingErrorStr = ''
    let currentTrainingError = trainingError;
    if (typeof trainingFailed === 'string') {
      currentTrainingError = trainingFailed;
      setTrainingError(currentTrainingError);
    }
    if (currentTrainingError) {
      trainingErrorStr = " - " + currentTrainingError;
    }

    let trainingStatusStr_ = (_training ? "Currently Training ..." : trainingComplete ? "Trained" : "Not Trained") + trainingErrorStr;
    if (percentComplete !== undefined) {
      trainingStatusStr_ += ` ${percentComplete}% complete`;
    }
    setTrainingStatusStr(trainingStatusStr_)
    console.log(`handleSetTrainingState new state: training ${_training}, trainingComplete ${trainingComplete}, trainingStatusStr ${trainingStatusStr_}`);

    const trainingButtonStr_ = _training ? '' : trainingComplete ? 'Retrain' : 'Train';
    setTrainingButtonStr(trainingButtonStr_)
    console.log(`handleSetTrainingState new trainingButtonStr ${trainingButtonStr_}`);
  };

  const handleTrainingCompleted = (info) => {
    console.log("handleTrainingCompleted", info);
  }

  const handleSetTrainingState_ = (props) => {
    handleSetTrainingState?.(props);
    const trainingCurrent = areTrainingSameBook_();
    console.log(`handleSetTrainingState - training Current Book: ${trainingCurrent}`);
  }

  const {
    areTrainingSameBook,
    cleanupWorker,
    failedToLoadCachedTraining,
    loadTranslationMemory,
    suggester,
    trainingRunning,
  } = useAlignmentSuggestions({
    contextId,
    createAlignmentTrainingWorker,
    doTraining: startTraining,
    handleSetTrainingState: handleSetTrainingState_,
    handleTrainingCompleted,
    shown: showDialog,
    sourceLanguageId: sourceLanguageId,
    targetLanguageId: targetLanguage?.languageId,
    targetUsfm: targetBibleBookUsfm,
    sourceUsfm: originalBibleBookUsfm,
  });

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
          setAutoTrainingCompleted(false)
        }
      } else { // have a book, so check if we have cached training data
        if (showDialog) {
          const trainingSameBook = areTrainingSameBook_()
          if (trainingRunning) {
            console.log('WordAlignerArea: training already running trainingSameBook:', trainingSameBook)
          }
          if (!startTraining && !autoTrainingCompleted) {
            const targetUsfmsBooks = translationMemory?.targetUsfms;
            const haveCachedTrainingData = targetUsfmsBooks && Object.keys(targetUsfmsBooks).length > 0;
            if (haveCachedTrainingData) {
              console.log('WordAlignerArea: translation memory changed, loading translation memory')
              loadTranslationMemory(translationMemory);
              setStartTraining(true);
            }
          }
        }
      }
    }
  }, [failedToLoadCachedTraining]);

  function doTraining() {
    console.log('WordAlignerDialog: doTraining')
    if (!startTraining) {
      console.log('WordAlignerDialog: doTraining - startTraining false, starting training')
      setStartTraining(true);
    } else {
      console.log('WordAlignerDialog: doTraining - startTraining true, resetting')
      setStartTraining(false);
      delay(500).then(() => {
        console.log('WordAlignerDialog: doTraining - starting training after delay')
        setStartTraining(true);
      })
    }
  }

  const alignerAreaStyle = useMemo(() => ({
    maxHeight: `${height}px`,
    overflowY: 'auto'
  }), [height]);

  const wordAlignerArea = useMemo(() => {
    console.log('WordAlignerDialog: wordAlignerArea regenerated')

      // Track which dependencies caused the useMemo to regenerate
      const dependencies = {
        contextId,
        doTraining,
        errorMessage,
        showDialog,
        sourceLanguageId,
        targetLanguage,
        targetWords,
        title,
        trainingButtonStr,
        trainingStatusStr,
        verseAlignments
      };

      console.log('WordAlignerDialog: wordAlignerArea dependencies:', dependencies);

      return <WordAlignerArea
        alignmentActions={alignmentActions_}
        contextId={contextId}
        doTraining={doTraining}
        errorMessage={errorMessage}
        lexiconCache={{}}
        loadLexiconEntry={getLexiconData}
        showingDialog={!!showDialog}
        sourceLanguageId={sourceLanguageId}
        style={alignerAreaStyle}
        suggester={suggester}
        targetLanguage={targetLanguage}
        targetLanguageFont={''}
        targetWords={targetWords}
        title={title || ''}
        trainingButtonStr={trainingButtonStr}
        trainingStatusStr={trainingStatusStr}
        translate={translate}
        verseAlignments={verseAlignments}
      />
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
      trainingButtonStr,
      trainingStatusStr,
      verseAlignments
    ]
  );

  return (
    <>
      <Dialog
        fullWidth={true}
        maxWidth={'lg'}
        onClose={() => {}}
        open={!!showDialog}
        PaperComponent={PaperComponent}
        bounds={bounds}
        aria-labelledby="draggable-aligner-dialog-title"
      >
        {wordAlignerArea}
      </Dialog>
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
    console.log('WordAlignerDialog React.memo: prop changed alignerStatus', {previousAlignmentData, nextAlignmentData})
    changedProps.alignerStatus = { from: previousAlignmentData, to: nextAlignmentData };
  }

  // Simple comparison for other props
  for (let key of keysToCompare.slice(1)) {
    if (prevProps[key] !== nextProps[key]) {
      console.log('WordAlignerDialog React.memo: prop changed', {key, from: prevProps[key], to: nextProps[key]})
      changedProps[key] = { from: prevProps[key], to: nextProps[key] };
    }
  }

  // Functions should be stable, but check reference equality
  if (prevProps.translate !== nextProps.translate) {
    console.log('WordAlignerDialog React.memo: translate function changed');
    changedProps.translate = 'function reference changed';
  }

  if (prevProps.getLexiconData !== nextProps.getLexiconData) {
    console.log('WordAlignerDialog React.memo: getLexiconData function changed');
    changedProps.getLexiconData = 'function reference changed';
  }

  const hasChanges = Object.keys(changedProps).length > 0;

  if (hasChanges) {
    console.log('WordAlignerDialog React.memo: Changed props summary:', changedProps);
    return false; // Props changed, re-render
  }

  console.log('WordAlignerDialog React.memo: No props changed, skipping re-render');
  return true; // Props are the same, skip re-render
});
