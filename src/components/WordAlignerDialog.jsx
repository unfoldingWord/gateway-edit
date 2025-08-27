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

function getBookData(alignerStatus_) {
  return alignerStatus_?.state?.reference || {};
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
  const [aligned, setAligned] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [alignerStatus_, setAlignerStatus_] = useState(null)
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
  const [alignmentActions, setAlignmentActions] = useState(null);
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
  const alignerData_ = alignerStatus_?.state?.alignerData;

  useEffect(() => { // monitor changes in alignment dialog position and open state
    if (alignerData_ &&
      currentInstance?.clientWidth &&
      currentInstance?.clientHeight) {
      console.log('WordAlignerDialog: updating bounds')
      doUpdateBounds()
    }
  }, [currentInstance, alignerData_])

  const {
    bookId,
    chapter,
    verse,
  } = getBookData(alignerStatus_)

  const targetBibleBookUsfm = alignerData_?.bibleUsfm || ''
  const translationMemory = useMemo(() => {
    return AlignmentTrainerUtils.makeTranslationMemory(bookId, originalBibleBookUsfm, targetBibleBookUsfm);
  }, [bookId, originalBibleBookUsfm, targetBibleBookUsfm]);

  const getContextId = (alignerStatus) => {
    if (alignerStatus?.state?.reference) {
      const alignerData = alignerStatus?.state?.alignerData || null
      const targetRef = alignerData?.resourceLink || ''
      let [ owner_, repoLanguageId, repoBibleId ] = targetRef.split('/')
      owner_ = owner_ || owner;
      const bibleId = owner_ && repoLanguageId && repoBibleId ? `${owner}/${repoLanguageId}/${repoBibleId}` : '';

      return {
        reference: alignerStatus?.state?.reference,
        tool: "wordAlignment",
        bibleId
      };
    }
    return null;
  }

  useEffect(() => {
    console.log('WordAlignerDialog mounted')
    // Cleanup function that runs on unmount
    return () => {
      console.log('WordAlignerDialog unmounted')
    };
  }, []);

  const alignerData = alignerStatus_?.state?.alignerData || null

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
    const alignerData_ = alignerStatus?.state?.alignerData;
    let newAlignerStatus = null

    if (alignerData_) { // see if aligner selected
      newAlignerStatus = alignerStatus;
    }

    if (!isEqual(alignerStatus_, newAlignerStatus)) {
      console.log('WordAlignerDialog alignerStatus changed', newAlignerStatus)
      setAlignerStatus_(newAlignerStatus)

      setAlignmentActions(newAlignerStatus?.actions)
      const sourceLanguageId_ = newAlignerStatus?.state?.sourceLanguage || ''
      setSourceLanguageId(sourceLanguageId_)
      const targetLanguage_ = newAlignerStatus?.state?.targetLanguage || null
      setTargetLanguage(targetLanguage_)

      const targetWords_ = alignerData_?.wordBank || []
      setTargetWords(targetWords_)

      const trainingStatusStr_ = ''
      setTrainingStatusStr(trainingStatusStr_)

      const verseAlignments_ = alignerData_?.alignments || []
      setVerseAlignments(verseAlignments_)

      const errorMessage_ = newAlignerStatus?.state?.errorMessage
      setErrorMessage(errorMessage_)

      const shouldShowDialog_ = !!(alignerData_?.alignments && alignerData_?.wordBank)
      if (showDialog !== shouldShowDialog_) {
        console.log('WordAlignerDialog: aligner visible state changed')
        setShowDialog(shouldShowDialog_)
      }
      setAligned(!!newAlignerStatus?.state?.aligned)
      const contextId_ = getContextId(newAlignerStatus);
      setContextId(contextId_);
      const title_ = getTitle(newAlignerStatus);
      setTitle(title_)

    } else {
      console.log('WordAlignerDialog alignerStatus changed yet not different', alignerStatus)
    }
  }, [alignerStatus?.state?.alignerData]);

  const handleSetTrainingState = ({
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

    const trainingStatusStr_ = (_training ? "Currently Training..." : trainingComplete ? "Trained" : "Not Trained") + trainingErrorStr;
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
        <WordAlignerArea
          aligned={aligned}
          alignmentActions={alignmentActions}
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

export default React.memo(WordAlignerDialog)
