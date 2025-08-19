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
  const dialogRef = useRef(null) // for keeping track of aligner dialog position
  const [startTraining, setStartTraining] = useState(false); // triggers start of training
  const [autoTrainingCompleted, setAutoTrainingCompleted] = useState(false); // triggers start of training
  const [trained, setTrained] = useState(false);
  const [training, setTraining] = useState(false);
  const alignerData_ = alignerStatus_?.state?.alignerData || null

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

  useEffect(() => { // monitor changes in alignment dialog position and open state
    if (alignerData_ &&
      currentInstance?.clientWidth &&
      currentInstance?.clientHeight) {
      console.log('WordAlignerDialog: updating bounds')
      doUpdateBounds()
    }
  }, [currentInstance, alignerData_])

  const errorMessage = alignerStatus_?.state?.errorMessage

  const {
    bookId,
    chapter,
    verse,
  } = alignerStatus_?.state?.reference || {}
  const title = `${bookId?.toUpperCase()} ${chapter}:${verse} in ${alignerStatus_?.state?.title}`

  const targetBibleBookUsfm = alignerData_?.scriptureConfig?.bibleUsfm || ''
  const translationMemory = {}
  if (bookId) {
    if (originalBibleBookUsfm) {
      translationMemory.sourceUsfms = {
        [bookId]: originalBibleBookUsfm
      }
    }
    if (targetBibleBookUsfm) {
      translationMemory.targetUsfms = {
        [bookId]: targetBibleBookUsfm
      }
    }
  }

  const contextId = useMemo(() => {
    const targetRef = alignerData_?.scriptureConfig?.resourceLink || ''
    const [ repoLanguageId, repoBibleId ] = targetRef.split('/')
    const bibleId = owner && repoLanguageId && repoBibleId ? `${owner}/${repoLanguageId}_${repoBibleId}` : '';

    return {
      reference: alignerStatus_?.state?.reference || {},
      tool: "wordAlignment",
      bibleId
    };
  }, [alignerStatus_?.state?.reference, owner, alignerData_?.scriptureConfig?.resourceLink]);

  useEffect(() => {
    console.log('WordAlignerDialog mounted')
    // Cleanup function that runs on unmount
    return () => {
      console.log('WordAlignerDialog unmounted')
    };
  }, []);

  useEffect(() => {
    let newAlignerStatus = null
    if (alignerStatus?.state?.alignerData) { // see if aligner selected
      newAlignerStatus = { // make shallow copy of alignerStatus
        state: alignerStatus?.state || null,
        actions: alignerStatus?.actions || null,
      }
    }

    if (!isEqual(alignerStatus_, newAlignerStatus)) {
      console.log('WordAlignerDialog alignerStatus changed', alignerStatus)
      setAlignerStatus_(newAlignerStatus)

      const alignerData_ = newAlignerStatus?.state?.alignerData || null
      const shouldShowDialog = !!(alignerData_?.alignments && alignerData_?.wordBank)
      if (showDialog !== shouldShowDialog) {
        console.log('WordAlignerDialog: aligner visible state changed')
        setShowDialog(shouldShowDialog)
      }
      setAligned(!!newAlignerStatus?.state?.aligned)

    } else {
      console.log('WordAlignerDialog alignerStatus changed yet not different', alignerStatus)
    }
  }, [alignerStatus, alignerStatus?.state?.alignerData]);

  const sourceLanguageId = alignerStatus_?.state?.sourceLanguage || ''
  const targetLanguage = alignerStatus_?.state?.targetLanguage || null

  const handleSetTrainingState = (_training, _trained) => {
    console.log('Updating training state: ' + _training);
    if (_training !== training) {
      setTraining(_training);
    }
    if (!_training && startTraining) {
      setStartTraining(false);
    }
    if (trained !== _trained) {
      setTrained(_trained);
    }
  };

  const trainingStatusStr = training ? "Currently Training..." : trained ? "Trained" : "Not Trained";

  const {
    cleanupWorker,
    failedToLoadCachedTraining,
    loadTranslationMemory,
    suggester,
  } = useAlignmentSuggestions({
    contextId,
    createAlignmentTrainingWorker,
    doTraining: startTraining,
    handleSetTrainingState,
    shown: showDialog,
    sourceLanguageId: sourceLanguageId,
    targetLanguageId: targetLanguage?.languageId,
  });

  // Effect to load translation memory when fail to load cached training Model
  useEffect(() => {
    const haveBook = contextId?.reference?.bookId;
    if (!haveBook) {
      if (autoTrainingCompleted) {
        setAutoTrainingCompleted(false)
      }
    } else { // have a book, so check if we have cached training data
      if (showDialog) {
        if (failedToLoadCachedTraining && !startTraining && !autoTrainingCompleted) {
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
  }, [failedToLoadCachedTraining, contextId, showDialog]);

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
          alignmentActions={alignerStatus_?.actions}
          errorMessage={errorMessage}
          title={title || ''}
          style={{ maxHeight: `${height}px`, overflowY: 'auto' }}
          verseAlignments={alignerData_?.alignments || []}
          targetWords={alignerData_?.wordBank || []}
          translate={translate}
          contextId={contextId}
          targetLanguage={targetLanguage}
          targetLanguageFont={''}
          sourceLanguageId={sourceLanguageId}
          lexiconCache={{}}
          loadLexiconEntry={getLexiconData}
          showingDialog={!!showDialog}
          trainingStatusStr={trainingStatusStr}
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
