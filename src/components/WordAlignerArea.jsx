/**
 * WordAlignerArea Component
 *
 * Synopsis:
 * A React component that renders the content for WordAlignerDialog.  It provides interactive with an interface for
 *   aligning words between source and target language texts.
 *   This component renders the main content area for word alignment operations within a dialog-based interface.
 *
 * Description:
 * This component serves as the core interface for word alignment functionality in the Gateway Edit Bible translation
 * application. It allows translators to create, edit, and manage word-level alignments between original language
 * texts (Hebrew/Greek) and target language translations. The component integrates with machine learning-based
 * suggestion systems to assist translators in creating accurate alignments more efficiently.
 *
 * Key Features:
 * - Interactive drag-and-drop word alignment interface
 * - Visual completion status indicators (linked/unlinked icons)
 * - Machine learning suggestion engine with training capabilities
 * - Lexicon integration with popover definitions
 * - Alignment reset functionality with confirmation dialog
 * - Real-time alignment validation and status tracking
 * - Training progress monitoring and status reporting
 *
 * Properties:
 * @param {Object} alignmentActions - Action handlers for saving/canceling alignments
 * @param {Function} alignmentActions.cancelAlignment - Cancels current alignment changes
 * @param {Function} alignmentActions.saveAlignment - Saves alignment changes
 * @param {Object} contextId - Context information for current verse/passage being aligned
 * @param {Function} doTraining - Triggers training of the alignment suggestion engine
 * @param {string} errorMessage - Error message to display if alignment operations fail
 * @param {Object} lexiconCache - Cached lexicon entries for performance optimization
 * @param {Function} loadLexiconEntry - Loads lexicon data for word definitions (required)
 * @param {Function} onChange - Callback fired when alignments change
 * @param {Function} setHandleSetTrainingState - Sets the training state handler reference
 * @param {string} sourceLanguageId - Identifier for source language (Hebrew/Greek) (required)
 * @param {string} sourceLanguageFont - Font family for source language text display
 * @param {number} sourceFontSizePercent - Font size percentage for source language
 * @param {Object} style - Custom CSS styles for the component
 * @param {Function} suggester - Function that provides alignment suggestions based on ML training
 * @param {Object} targetLanguage - Target language configuration object (required)
 * @param {string} targetLanguageFont - Font family for target language text display
 * @param {number} targetFontSizePercent - Font size percentage for target language
 * @param {Array} targetWords - Array of target language words to be aligned
 * @param {string} title - Title displayed in the alignment dialog header
 * @param {Function} translate - Translation function for UI text localization (required)
 * @param {Array} verseAlignments - Current alignment data for the verse
 *
 * Requirements:
 * - enhanced-word-aligner-rcl package for core alignment functionality
 * - react-icons/rx for status indicator icons
 * - deep-equal for state comparison optimization
 * - lodash.clonedeep for deep object cloning
 * - react-bootstrap for Label component
 * - PopoverComponent for lexicon definition display
 *
 * Technical Dependencies:
 * - AlignmentHelpers from enhanced-word-aligner-rcl for alignment validation
 * - EnhancedWordAligner from enhanced-word-aligner-rcl for the main alignment interface with alignment suggestions
 * - Requires proper integration with parent WordAlignerDialog component
 * - Depends on lexicon data infrastructure for word definitions
 */

import React, {useEffect, useMemo, useState} from 'react'
import PropTypes from 'prop-types'
import DialogTitle from '@mui/material/DialogTitle'
import { RxLink2, RxLinkBreak2 } from 'react-icons/rx'
import {
  AlignmentHelpers,
  EnhancedWordAligner,
  useTrainingState,
} from 'enhanced-word-aligner-rcl'
import { Label } from 'react-bootstrap';
import isEqual from 'deep-equal';
import cloneDeep from 'lodash.clonedeep';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { DialogActions, DialogContent, DialogContentText } from '@mui/material';
import { createAlignmentTrainingWorker } from '../workers/startAlignmentTrainer'
import PopoverComponent from './PopoverComponent'
import {delay} from "@utils/resources";

const alignmentIconStyle = { marginLeft:'50px' }

// popup dialog for user to align verse
function WordAlignerArea({
  alignmentActions,
  contextId,
  errorMessage,
  height,
  lexiconCache,
  loadLexiconEntry,
  onChange,
  sourceLanguageId,
  sourceLanguageFont,
  sourceFontSizePercent,
  targetLanguage,
  targetLanguageFont,
  targetFontSizePercent,
  targetWords,
  title,
  translate,
  translationMemory,
  verseAlignments,
}) {
  const [state, setState] = useState({
    aligned_: false,
    alignmentChange: null,
    doTraining: false,
    initialAlignment: null,
    lexiconData: null,
    showResetWarning: false,
    trainingButtonHintStr: '',
  });

  const {
    aligned_,
    alignmentChange,
    doTraining,
    initialAlignment,
    lexiconData,
    showResetWarning,
  } = state;

  const {
    actions: {
      handleTrainingStateChange
    },
    state: {
      training,
      trained,
      trainingError,
      trainingStatusStr,
      trainingButtonStr,
      trainingButtonHintStr,
    }
  } = useTrainingState({
    translate,
  })

  useEffect(() => {
    console.log('WordAlignerArea mounted')
    // Cleanup function that runs on unmount
    return () => {
      console.log('WordAlignerArea unmounted')
    };
  }, []);

  const currentShowDialog = !!(targetWords?.length && verseAlignments?.length)

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
    console.log('WordAlignerArea: cancelAlignment')
    const cancelAlignment = alignmentActions?.cancelAlignment
    cancelAlignment?.()
    setState(prevState => ({ ...prevState, alignmentChange: null }));
  }

  function saveAlignment() {
    console.log('WordAlignerArea: saveAlignment')
    const saveAlignment = alignmentActions?.saveAlignment
    saveAlignment?.(alignmentChange)
    setState(prevState => ({ ...prevState, alignmentChange: null }));
  }

  function handleDoTraining() {
    console.log('WordAlignerArea: handleDoTraining')
    if (!doTraining) {
      setState(prevState => ({ ...prevState, doTraining: true }));
    } else {
      console.log('WordAlignerArea: handleDoTraining - doTraining already set')
    }
  }

  function handleInfoClick(info) {
    console.log("handleInfoClick");
    const message = JSON.stringify(info, null, 2)
    window.prompt(`Training Model: ${info}`)
  }

  useEffect(() => {
    if (doTraining && !training) {
      console.log('WordAlignerArea: training completed')
      setState(prevState => ({ ...prevState, doTraining: false }));
    }
  }, [training]);

  /**
   * reset all the alignments
   */
  function doReset() {
    console.log('WordAlignerArea: doReset')
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
  const wordSuggesterConfig= {
    doAutoTraining: true, // set true to enable auto training of alignment suggestions
    trainOnlyOnCurrentBook: true, // if true, then training is sped up for small books by just training on alignment memory data for current book
    minTrainingVerseRatio: 1.2, // if trainOnlyOnCurrentBook, then this is protection for the case that the book is not completely aligned.  If a ratio such as 1.0 is set, then training will use the minimum number of verses for training.  This minimum is calculated by multiplying the number of verses in the book by this ratio
    keepAllAlignmentMinThreshold: 90, // EXPERIMENTAL FEATURE - if threshold percentage is set (such as value 60), then alignment data not used for training will be added back into wordMap after training, but only if the percentage of book alignment is less than this threshold.  This should improve alignment vocabulary for books not completely aligned
  }

  const alignerAreaStyle = useMemo(() => ({
    maxHeight: `${height}px`,
    overflowY: 'auto'
  }), [height]);

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
        <EnhancedWordAligner
          addTranslationMemory={translationMemory}
          config={wordSuggesterConfig}
          contextId={contextId}
          createAlignmentTrainingWorker={createAlignmentTrainingWorker}
          doTraining={doTraining}
          handleInfoClick={handleInfoClick}
          handleTrainingStateChange={handleTrainingStateChange}
          lexicons={lexiconCache}
          loadLexiconEntry={loadLexiconEntry}
          onChange={onAlignmentChange}
          showPopover={showPopover}
          sourceLanguageId={sourceLanguageId}
          styles={alignerAreaStyle}
          suggestionsOnly={true}
          targetLanguageId={targetLanguage?.languageId || ''}
          targetLanguageFont={targetLanguageFont}
          targetWords={initialAlignment?.targetWords ||[]}
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
        { !errorMessage && trainingButtonStr && !training &&
          <Button
            variant="outlined"
            style={{margin: '10px 30px'}}
            onClick={handleDoTraining}
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
  errorMessage: PropTypes.string,
  height: PropTypes.number,
  lexiconCache: PropTypes.object,
  loadLexiconEntry: PropTypes.func.isRequired,
  onChange: PropTypes.func,
  sourceLanguageId: PropTypes.string.isRequired,
  sourceLanguageFont: PropTypes.string,
  sourceFontSizePercent: PropTypes.number,
  targetLanguage: PropTypes.object.isRequired,
  targetLanguageFont: PropTypes.string,
  targetFontSizePercent: PropTypes.number,
  targetWords: PropTypes.array,
  title: PropTypes.string,
  translate: PropTypes.func.isRequired,
  translationMemory: PropTypes.object,
  verseAlignments: PropTypes.array,
};

export default WordAlignerArea
