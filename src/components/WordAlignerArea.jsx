import React, {useCallback, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import DialogTitle from '@mui/material/DialogTitle'
import { RxLink2, RxLinkBreak2 } from 'react-icons/rx'
import {
  AlignmentHelpers,
  SuggestingWordAligner,
} from 'enhanced-word-aligner-rcl'
import isEqual from 'deep-equal';
import cloneDeep from 'lodash.clonedeep';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { DialogActions, DialogContent, DialogContentText } from '@mui/material';
import PopoverComponent from './PopoverComponent'
import {Label} from "react-bootstrap";

const alignmentIconStyle = { marginLeft:'50px' }

// popup dialog for user to align verse
function WordAlignerArea({
  alignmentActions,
  contextId,
  doTraining,
  errorMessage,
  lexiconCache,
  loadLexiconEntry,
  onChange,
  setHandleSetTrainingState,
  sourceLanguageId,
  sourceLanguageFont,
  sourceFontSizePercent,
  style,
  suggester: suggester_,
  targetLanguage,
  targetLanguageFont,
  targetFontSizePercent,
  targetWords,
  title,
  translate,
  verseAlignments,
}) {
  const [state, setState] = useState({
    aligned_: false,
    alignmentChange: null,
    initialAlignment: null,
    lexiconData: null,
    showResetWarning: false,
    suggester: suggester_,
    trained: false,
    training: false,
    trainingError: '',
    trainingStatusStr: '',
    trainingButtonStr: '',
    trainingButtonHintStr: '',
  });

  const {
    aligned_,
    alignmentChange,
    initialAlignment,
    lexiconData,
    showResetWarning,
    suggester,
    trained,
    training,
    trainingError,
    trainingStatusStr,
    trainingButtonStr,
    trainingButtonHintStr,
  } = state;

  useEffect(() => {
    console.log('WordAlignerArea mounted')
    setHandleSetTrainingState(handleSetTrainingState)
    // Cleanup function that runs on unmount
    return () => {
      setHandleSetTrainingState(null)
      console.log('WordAlignerArea unmounted')
    };
  }, []);

  const currentShowDialog = !!(targetWords?.length && verseAlignments?.length)

  const handleSetTrainingState = (props) => {
    if (!props) {
      console.log('handleSetTrainingState: no props');
      return;
    }

    let {
      percentComplete,
      training: _training,
      trainingComplete,
      trainingFailed,
      suggester: suggester_,
    } = props || {};

    if (_training === undefined) {
      _training = training;
    } else {
      // console.log('Updating training state: ' + _training);
    }
    if (trainingComplete === undefined) {
      trainingComplete = trained;
    } else {
      // console.log('Updating trainingComplete state: ' + trainingComplete);
    }

    const newState = { };

    if (_training !== training) {
      newState.training = _training;
    }

    if (trainingComplete !== trained) {
      newState.trained = trainingComplete;
    }

    if (suggester_ !== undefined) { // if suggester updated
      newState.suggester = suggester_
    }

    let trainingErrorStr = ''
    let currentTrainingError = trainingError;
    if (typeof trainingFailed === 'string') {
      currentTrainingError = trainingFailed;
      newState.trainingError = currentTrainingError;
    }
    if (currentTrainingError) {
      trainingErrorStr = " - " + currentTrainingError;
    }

    const trainingMessage = trainingComplete ? "Trained, but updating ..." : "Currently Training ...";
    let trainingStatusStr_ = (_training ? trainingMessage : trainingComplete ? "Trained" : "Not Trained") + trainingErrorStr;
    if (percentComplete !== undefined) {
      trainingStatusStr_ += ` ${percentComplete}% complete`;
    }
    newState.trainingStatusStr = trainingStatusStr_;
    console.log(`handleSetTrainingState new state: training ${_training}, trainingComplete ${trainingComplete}, trainingStatusStr ${trainingStatusStr_}`, props);

    const trainingButtonStr_ = _training ? '' : trainingComplete ? translate('suggestions.retrain_button') : translate('suggestions.train_button');
    newState.trainingButtonStr = trainingButtonStr_;
    const trainingButtonHintStr_ = _training ? '' : trainingComplete ? translate('suggestions.retrain_button_hint') : translate('suggestions.train_button_hint');
    newState.trainingButtonHintStr = trainingButtonHintStr_;
    // console.log(`handleSetTrainingState new trainingButtonStr ${trainingButtonStr_}`);

    setState(prevState => ({
      ...prevState,
      ...newState,
    }));
  }

  useEffect(() => {
    // see if alignment data has changed
    const verseAlignments_ = initialAlignment?.verseAlignments;
    const targetWords_ = initialAlignment?.targetWords;
    const changedTW = !isEqual(targetWords, targetWords_);
    const changedVA = !isEqual(verseAlignments, verseAlignments_);

    if (changedTW || changedVA) {
      console.log(`WordAlignerArea: alignment data changed - changedTW ${changedTW}, changedVA ${changedVA}, TW ${!!targetWords_}, VA ${!!verseAlignments_}`)
      const newAlignment = {
        verseAlignments,
        targetWords,
      }

      const alignmentComplete = AlignmentHelpers.areAlgnmentsComplete(targetWords, verseAlignments);

      setState(prevState => ({
        ...prevState,
        initialAlignment: cloneDeep(newAlignment),
        aligned_: alignmentComplete
      }));
    }
  }, [targetWords, verseAlignments])

  function onAlignmentChange(results) {
    const alignmentComplete = AlignmentHelpers.areAlgnmentsComplete(results.targetWords, results.verseAlignments);
    setState(prevState => ({
      ...prevState,
      alignmentChange: results,
      aligned_: alignmentComplete
    }));
  }

  function cancelAlignment() {
    console.log('WordAlignerDialog: cancelAlignment')
    const cancelAlignment = alignmentActions?.cancelAlignment
    cancelAlignment?.()
    setState(prevState => ({ ...prevState, alignmentChange: null }));
  }

  function saveAlignment() {
    console.log('WordAlignerDialog: saveAlignment')
    const saveAlignment = alignmentActions?.saveAlignment
    saveAlignment?.(alignmentChange)
    setState(prevState => ({ ...prevState, alignmentChange: null }));
  }

  /**
   * reset all the alignments
   */
  function doReset() {
    console.log('WordAlignerDialog: doReset')
    const alignmentData_ = AlignmentHelpers.resetAlignments(initialAlignment?.verseAlignments, initialAlignment?.targetWords)

    const alignmentChange_ = {
      ...alignmentChange,
      targetWords: alignmentData_?.targetWords,
      verseAlignments: alignmentData_?.verseAlignments,
    }

    setState(prevState => ({
      ...prevState,
      initialAlignment: cloneDeep(alignmentData_),
      alignmentChange: cloneDeep(alignmentChange_),
      showResetWarning: false
    }));
  }

  function showPopover(PopoverTitle, wordDetails, positionCoord, rawData) {
    console.log(`showPopover`, rawData)
    setState(prevState => ({
      ...prevState,
      lexiconData: {
        PopoverTitle,
        wordDetails,
        positionCoord,
        rawData,
      }
    }));
  }

  const enableResetWarning = (currentShowDialog && showResetWarning);

  return (
    <>
      <DialogTitle style={{cursor: 'move'}} id="draggable-aligner-dialog-title">
        <span>
          {`Aligning: ${title}`}
          {aligned_ ? (
            <RxLink2 style={alignmentIconStyle} id='valid_icon' color='#BBB'/>
          ) : (
            <RxLinkBreak2 style={alignmentIconStyle} id='invalid_icon' color='#000'/>
          )}
        </span>
      </DialogTitle>
      <div style={{width: `95%`, margin: '10px'}}>
        <SuggestingWordAligner
          contextId={contextId}
          lexiconCache={lexiconCache}
          loadLexiconEntry={loadLexiconEntry}
          onChange={onAlignmentChange}
          showPopover={showPopover}
          sourceLanguage={sourceLanguageId}
          style={style}
          suggester={suggester}
          suggestionsOnly={true}
          targetWords={initialAlignment?.targetWords ||[]}
          targetLanguage={targetLanguage}
          targetLanguageFont={targetLanguageFont}
          translate={translate}
          verseAlignments={initialAlignment?.verseAlignments || []}
        />
      </div>
      <div style={{width: `auto`, height: '60px', display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>
        <Button
          variant="outlined"
          style={{margin: '10px 30px'}}
          onClick={cancelAlignment}
          title={translate('alignments.cancel_hint')}
        >
          {translate('alignments.cancel')}
        </Button>
        {!errorMessage && // only show if there is no error
            <Button
              variant="outlined"
              style={{margin: '10px 30px'}}
              onClick={() => setState(prevState => ({ ...prevState, showResetWarning: true }))}
              title={translate('alignments.reset_hint')}
            >
              {translate('alignments.reset')}
            </Button>
        }
        {!errorMessage && // only show if there is no error
            <Button
              variant="outlined"
              style={{margin: '10px 30px'}}
              onClick={saveAlignment}
              title={translate('alignments.accept_hint')}
            >
              {translate('alignments.accept')}
            </Button>
        }
        { !errorMessage && trainingButtonStr &&
          <Button
            variant="outlined"
            style={{margin: '10px 30px'}}
            onClick={doTraining}
            title={trainingButtonHintStr}
          >
            {trainingButtonStr}
          </Button>
        }
        {!errorMessage && // only show if there is no error
          <Label style={{margin: '10px 30px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            {trainingStatusStr || ''}
          </Label>
        }
      </div>
      {/** Lexicon Popup dialog */}
      <PopoverComponent
        popoverVisibility={lexiconData}
        title={lexiconData?.PopoverTitle || ''}
        bodyText={lexiconData?.wordDetails || ''}
        positionCoord={lexiconData?.positionCoord}
        onClosePopover={() => setState(prevState => ({ ...prevState, lexiconData: null }))}
      />

      <Dialog open={enableResetWarning} onClose={() => setState(prevState => ({ ...prevState, showResetWarning: false }))} aria-labelledby="reset-warn-dialog">
        <DialogTitle id="form-dialog-title">{translate('warning')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {translate('alignments.reset_confirm')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setState(prevState => ({ ...prevState, showResetWarning: false }))} color="primary">
            {translate('no')}
          </Button>
          <Button onClick={doReset} color="secondary">
            {translate('yes')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

WordAlignerArea.propTypes = {
  alignmentActions: PropTypes.shape({
    cancelAlignment: PropTypes.func,
    saveAlignment: PropTypes.func,
  }),
  contextId: PropTypes.object,
  doTraining: PropTypes.func,
  errorMessage: PropTypes.string,
  lexiconCache: PropTypes.object,
  loadLexiconEntry: PropTypes.func.isRequired,
  onChange: PropTypes.func,
  setHandleSetTrainingState: PropTypes.func,
  sourceLanguageId: PropTypes.string.isRequired,
  sourceLanguageFont: PropTypes.string,
  sourceFontSizePercent: PropTypes.number,
  suggester: PropTypes.func,
  style: PropTypes.object,
  targetLanguage: PropTypes.object.isRequired,
  targetLanguageFont: PropTypes.string,
  targetFontSizePercent: PropTypes.number,
  targetWords: PropTypes.array,
  title: PropTypes.string,
  translate: PropTypes.func.isRequired,
  verseAlignments: PropTypes.array,
};

export default WordAlignerArea
