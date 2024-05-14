import React, {
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import PropTypes from 'prop-types'
import cloneDeep from 'lodash.clonedeep'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import { AlignmentHelpers } from 'word-aligner-rcl'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Draggable from 'react-draggable'
import {
  DialogActions,
  DialogContent,
  DialogContentText,
} from '@mui/material'
import { useBoundsUpdater } from 'translation-helps-rcl'
import PopoverComponent from './PopoverComponent'
import { StoreContext } from '@context/StoreContext'
import WordAlignerArea from './WordAlignerArea';

const alignmentIconStyle = { marginLeft:'50px' }

// popup dialog for user to align verse
export default function WordAlignerDialog({
  alignerStatus,
  height,
  translate,
  getLexiconData,
}) {
  const [alignmentChange, setAlignmentChange] = useState(null)
  const [aligned, setAligned] = useState(false)
  const [lexiconData, setLexiconData] = useState(null)
  const [dialogState, setDialogState_] = useState({})
  const [showResetWarning, setShowResetWarning] = useState(false)
  const dialogRef = useRef(null) // for keeping track of  aligner dialog position

  const alignerData_ = alignerStatus?.state?.alignerData || null
  const shouldShowDialog = !!(alignerData_?.alignments && alignerData_?.wordBank)
  const currentShowDialog = !!dialogState?.showDialog

  const {
    state: {
      mainScreenRef,
    },
  } = useContext(StoreContext)

  const boundsParams = { // keeps track of drag bounds
    workspaceRef: mainScreenRef,
    cardRef: dialogRef,
    open: !!currentShowDialog,
    displayState: {
      alignerData: currentShowDialog
    },
  };
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

  useEffect(() => { // set initial aligned state
    if (alignerData_) {
      setAligned(!!alignerStatus?.state?.aligned)
    }
  }, [alignerData_])

  useEffect(() => {
    console.log('WordAlignerDialog: aligner data changed')
    if (currentShowDialog !== shouldShowDialog) {
      console.log('WordAlignerDialog: aligner visible state changed')
      const dialogState_ = {
        ...alignerData_,
        showDialog: shouldShowDialog,
      };
      setDialogState(dialogState_)
    }
  }, [alignerData_])

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

  /**
   * called on every alignment change.  We save this new alignment state so that it can be applied if user clicks accept.
   *   We also update the aligned status so that the UI can be updated dynamically
   * @param {object} results
   */
  function onAlignmentChange(results) {
    console.log('WordAlignerDialog: onAlignmentChange')
    const alignmentComplete = AlignmentHelpers.areAlgnmentsComplete(results?.targetWords, results?.verseAlignments);
    setAlignmentChange(results) // save the most recent change
    setAligned(alignmentComplete) // update alignment complete status
  }

  function showPopover(PopoverTitle, wordDetails, positionCoord, rawData) {
    // TODO: make show popover pretty and fix positioning
    console.log(`showPopover`, rawData)
    setLexiconData({
      PopoverTitle,
      wordDetails,
      positionCoord,
      rawData,
    })
  }

  const errorMessage = alignerStatus?.state?.errorMessage

  useEffect(() => { // set initial aligned state
    if (shouldShowDialog) {
      console.log('WordAlignerDialog: set initial aligned state')
      setAligned(!!alignerStatus?.state?.aligned)
    }
  }, [shouldShowDialog, alignerStatus])

  const {
    projectId,
    chapter,
    verse,
  } = alignerStatus?.state?.reference || {}
  const title = `${projectId?.toUpperCase()} ${chapter}:${verse} in ${alignerStatus?.state?.title}`

  function setDialogState(newState) {
    const dialogState_ = cloneDeep(
      {
        ...dialogState,
        ...newState,
      }
    )
    setDialogState_(dialogState_)
  }
  function cancelAlignment() {
    console.log('WordAlignerDialog: cancelAlignment')
    const cancelAlignment = alignerStatus?.actions?.cancelAlignment
    cancelAlignment?.()
    setAlignmentChange(null)
  }

  function saveAlignment() {
    console.log('WordAlignerDialog: saveAlignment')
    const saveAlignment = alignerStatus?.actions?.saveAlignment
    saveAlignment?.(alignmentChange)
    setAlignmentChange(null)
  }

  function setShowDialog(show) {
    console.log('WordAlignerDialog: setShowDialog', show)
    const _dialogState = {
      showDialog: !!show,
    }
    setDialogState(_dialogState);
  }

  /**
   * reset all the alignments
   */
  function doReset() {
    console.log('WordAlignerDialog: doReset')
    setShowDialog(false) // momentarily hide the dialog
    const alignmentData_ = AlignmentHelpers.resetAlignments(showDialog?.verseAlignments, showDialog?.targetWords)

    const showDialog = true;
    const dialogState_ = {
      ...alignmentData_, // merge in reset alignment data
      showDialog,
    }

    setDialogState(dialogState_); // this causes word aligner to redraw with empty alignments
    setAlignmentChange(cloneDeep(alignmentData_)) // clear the last alignment changes in case user next does save
  }

  const enableResetWarning = (currentShowDialog && showResetWarning);

  return (
    <>
      <Dialog
        fullWidth={true}
        maxWidth={'lg'}
        onClose={() => {}}
        open={!!currentShowDialog}
        PaperComponent={PaperComponent}
        bounds={bounds}
        aria-labelledby="draggable-aligner-dialog-title"
      >
        <WordAlignerArea
          aligned={aligned}
          alignmentIconStyle={alignmentIconStyle}
          title={title || ''}
          style={{ maxHeight: `${height}px`, overflowY: 'auto' }}
          verseAlignments={dialogState?.alignments || []}
          targetWords={dialogState?.wordBank || []}
          translate={translate}
          contextId={{ reference: alignerStatus?.state?.reference || {} }}
          targetLanguage={alignerStatus?.state?.targetLanguage || ''}
          targetLanguageFont={''}
          sourceLanguage={alignerStatus?.state?.sourceLanguage || ''}
          showPopover={showPopover}
          lexiconCache={{}}
          loadLexiconEntry={getLexiconData}
        />

        <span style={{ width : `95%`, height: '60px', display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
          <Button variant="outlined" style={{ margin: '10px 100px' }} onClick={cancelAlignment}>
            Cancel
          </Button>
          {!errorMessage && // only show these buttons if there is no error
            <>
              <Button variant="outlined" style={{ margin: '10px 100px' }} onClick={() => setShowResetWarning(true)}>
                Reset
              </Button>
              <Button variant="outlined" style={{ margin: '10px 100px' }} onClick={saveAlignment}>
                Accept
              </Button>
            </>
          }
        </span>
      </Dialog>
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

WordAlignerDialog.propTypes = {
  alignerStatus: PropTypes.object.isRequired,
  height: PropTypes.number.isRequired,
  translate: PropTypes.func.isRequired,
  getLexiconData: PropTypes.func.isRequired,
}
