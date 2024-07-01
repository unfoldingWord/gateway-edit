import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import DialogTitle from '@mui/material/DialogTitle'
import { RxLink2, RxLinkBreak2 } from 'react-icons/rx'
import { AlignmentHelpers, WordAligner } from 'word-aligner-rcl'
import * as isEqual from "deep-equal";
import cloneDeep from "lodash.clonedeep";
import Button from "@mui/material/Button";
import PopoverComponent from "./PopoverComponent";
import Dialog from "@mui/material/Dialog";
import {DialogActions, DialogContent, DialogContentText} from "@mui/material";

const alignmentIconStyle = { marginLeft:'50px' }

// popup dialog for user to align verse
export default function WordAlignerArea({
  aligned,
  alignmentActions,
  contextId,
  errorMessage,
  lexiconCache,
  loadLexiconEntry,
  onChange,
  sourceLanguage,
  sourceLanguageFont,
  sourceFontSizePercent,
  style,
  targetLanguage,
  targetLanguageFont,
  targetFontSizePercent,
  title,
  translate,
  targetWords,
  verseAlignments,
}) {
  const [aligned_, setAligned] = useState(aligned)
  const [alignmentChange, setAlignmentChange] = useState(null)
  const [initialAlignment, setInitialAlignment] = useState(null)
  const [lexiconData, setLexiconData] = useState(null)
  const [showResetWarning, setShowResetWarning] = useState(false)
  const currentShowDialog = !!(targetWords?.length && verseAlignments?.length)

  useEffect(() => {
    // see if alignment data has changed
    const verseAlignments_ = initialAlignment?.verseAlignments;
    const targetWords_ = initialAlignment?.targetWords;
    const changedTW = !isEqual(targetWords, targetWords_);
    const changedVA = !isEqual(verseAlignments, verseAlignments_);

    if (changedTW || changedVA) {
      console.log('WordAlignerArea: alignment data changed')
      const newAlignment = {
        verseAlignments,
        targetWords,
      }
      setInitialAlignment(cloneDeep(newAlignment))
    }
  }, [targetWords, verseAlignments])

  useEffect(() => {
    if (aligned !== aligned_) {
      console.log('WordAlignerArea: set alignment to', aligned)
      setAligned(aligned)
    }
  }, [aligned])

  function onAlignmentChange(results) {
    const alignmentComplete = AlignmentHelpers.areAlgnmentsComplete(results.targetWords, results.verseAlignments);
    setAlignmentChange(results) // save the most recent change
    setAligned(alignmentComplete) // update alignment complete status
  }

  function cancelAlignment() {
    console.log('WordAlignerDialog: cancelAlignment')
    const cancelAlignment = alignmentActions?.cancelAlignment
    cancelAlignment?.()
    setAlignmentChange(null)
  }

  function saveAlignment() {
    console.log('WordAlignerDialog: saveAlignment')
    const saveAlignment = alignmentActions?.saveAlignment
    saveAlignment?.(alignmentChange)
    setAlignmentChange(null)
  }

  /**
   * reset all the alignments
   */
  function doReset() {
    console.log('WordAlignerDialog: doReset')
    const alignmentData_ = AlignmentHelpers.resetAlignments(initialAlignment?.verseAlignments, initialAlignment?.targetWords)
    setInitialAlignment(cloneDeep(alignmentData_))
    const alignmentChange_ = {
      ...alignmentChange,
      targetWords: alignmentData_?.targetWords,
      verseAlignments: alignmentData_?.verseAlignments,
    }
    setAlignmentChange(cloneDeep(alignmentChange_))
    setShowResetWarning(false)
  }

  function showPopover(PopoverTitle, wordDetails, positionCoord, rawData) {
    console.log(`showPopover`, rawData)
    setLexiconData({
      PopoverTitle,
      wordDetails,
      positionCoord,
      rawData,
    })
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
        <WordAligner
          style={style}
          verseAlignments={initialAlignment?.verseAlignments || []}
          targetWords={initialAlignment?.targetWords ||[]}
          translate={translate}
          contextId={contextId}
          targetLanguage={targetLanguage}
          targetLanguageFont={targetLanguageFont}
          sourceLanguage={sourceLanguage}
          showPopover={showPopover}
          lexiconCache={lexiconCache}
          loadLexiconEntry={loadLexiconEntry}
          onChange={onAlignmentChange}
        />
      </div>
      <span style={{width: `95%`, height: '60px', display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>
          <Button variant="outlined" style={{margin: '10px 100px'}} onClick={cancelAlignment}>
            Cancel
          </Button>
        {!errorMessage && // only show these buttons if there is no error
          <>
            <Button variant="outlined" style={{margin: '10px 100px'}} onClick={() => setShowResetWarning(true)}>
              Reset
            </Button>
            <Button variant="outlined" style={{margin: '10px 100px'}} onClick={saveAlignment}>
              Accept
            </Button>
          </>
        }
        </span>
      {/** Lexicon Popup dialog */}
      <PopoverComponent
        popoverVisibility={lexiconData}
        title={lexiconData?.PopoverTitle || ''}
        bodyText={lexiconData?.wordDetails || ''}
        positionCoord={lexiconData?.positionCoord}
        onClosePopover={() => setLexiconData(null)}
      />

      <Dialog open={enableResetWarning} onClose={() => setShowResetWarning(false)} aria-labelledby="reset-warn-dialog">
        <DialogTitle id="form-dialog-title">{'Warning'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {'Are you sure you want to clear all alignments?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResetWarning(false)} color="primary">
            No
          </Button>
          <Button onClick={doReset} color="secondary">
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

WordAlignerArea.propTypes = {
  aligned: PropTypes.bool,
  alignmentActions: PropTypes.func,
  contextId: PropTypes.object.isRequired,
  errorMessage: PropTypes.string,
  lexiconCache: PropTypes.object,
  loadLexiconEntry: PropTypes.func.isRequired,
  onChange: PropTypes.func,
  sourceLanguage: PropTypes.string.isRequired,
  sourceLanguageFont: PropTypes.string,
  sourceFontSizePercent: PropTypes.number,
  targetLanguageFont: PropTypes.string,
  targetFontSizePercent: PropTypes.number,
  translate: PropTypes.func.isRequired,
  title: PropTypes.string,
  verseAlignments: PropTypes.array.isRequired,
  targetWords: PropTypes.array.isRequired,
};

