import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import PropTypes from 'prop-types'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import { RxLink2, RxLinkBreak2 } from 'react-icons/rx'
import { AlignmentHelpers, WordAligner } from 'word-aligner-rcl'
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

const alignmentIconStyle = { marginLeft:'50px' }

// popup dialog for user to align verse
export default function WordAlignerDialog({
  alignerStatus,
  height,
  translate,
  getLexiconData,
}) {
  const [alignerData, setAlignerData] = useState(null)
  const [alignmentChange, setAlignmentChange] = useState(null)
  const [aligned, setAligned] = useState(false)
  const [lexiconData, setLexiconData] = useState(null)
  const [showResetWarning, setShowResetWarning] = useState(false)
  const dialogRef = useRef(null) // for keeping track of  aligner dialog position

  const alignerData_ = alignerStatus?.state?.alignerData

  const {
    state: {
      mainScreenRef,
    },
  } = useContext(StoreContext)

  const {
    state: { bounds },
    actions: { doUpdateBounds },
  } = useBoundsUpdater({ // keeps track of drag bounds
    workspaceRef: mainScreenRef,
    cardRef: dialogRef,
    open: !!alignerData,
    displayState: {
      alignerData
    },
  })

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

  useEffect(() => {
    setAlignerData(alignerData_)
  }, [alignerData_])

  useEffect(() => { // monitor changes in alignment dialog position and open state
    if (alignerData &&
      dialogRef?.current?.clientWidth &&
      dialogRef?.current?.clientHeight) {
      doUpdateBounds()
    }
  }, [dialogRef?.current, alignerData])

  /**
   * called on every alignment change.  We save this new alignment state so that it can be applied if user clicks accept.
   *   We also update the aligned status so that the UI can be updated dynamically
   * @param {object} results
   */
  function onAlignmentChange(results) {
    const onAlignmentsChange = alignerStatus?.actions?.onAlignmentsChange
    const alignmentComplete = onAlignmentsChange?.(results)
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

  const errorMessage = alignerData?.errorMessage

  useEffect(() => { // set initial aligned state
    if (alignerData) {
      setAligned(!!alignerStatus?.state?.aligned)
    }
  }, [alignerData, alignerStatus])

  const {
    projectId,
    chapter,
    verse,
  } = alignerStatus?.state?.reference || {}
  const title = `${projectId?.toUpperCase()} ${chapter}:${verse} in ${alignerStatus?.state?.title}`

  function cancelAlignment() {
    const cancelAlignment = alignerStatus?.actions?.cancelAlignment
    cancelAlignment?.()
    setAlignmentChange(null)
  }

  function saveAlignment() {
    const saveAlignment = alignerStatus?.actions?.saveAlignment
    saveAlignment?.(alignmentChange)
    setAlignmentChange(null)
  }

  /**
   * reset all the alignments
   */
  function doReset() {
    console.log('WordAlignerDialog() - reset Alignments Clicked')
    setShowResetWarning(false)
    const alignmentData_ = AlignmentHelpers.resetAlignments(alignerData?.alignments, alignerData?.wordBank)

    setAlignerData({ // this causes word aligner to redraw with empty alignments
      alignments: alignmentData_.verseAlignments,
      wordBank: alignmentData_.targetWords,
    })

    const latestChange = alignmentChange || {}
    const alignmentChange_ = {
      ...latestChange, // keep old data
      ...alignmentData_, // merge in reset alignment data
    }

    setAlignmentChange(alignmentChange_) // clear the last alignment changes in case user next does save
  }

  const enableResetWarning = useMemo( () => (showResetWarning && !!alignerData), [showResetWarning && !!alignerData])

  return (
    <>
      <Dialog
        fullWidth={true}
        maxWidth={'lg'}
        onClose={() => {}}
        open={!!alignerData}
        PaperComponent={PaperComponent}
        bounds={bounds}
        aria-labelledby="draggable-aligner-dialog-title"
      >
        <DialogTitle style={{ cursor: 'move' }} id="draggable-aligner-dialog-title" >
          <span>
            {`Aligning: ${title}`}
            {aligned? (
              <RxLink2 style={alignmentIconStyle} id='valid_icon' color='#BBB' />
            ) : (
              <RxLinkBreak2 style={alignmentIconStyle} id='invalid_icon' color='#000' />
            )}
          </span>
        </DialogTitle>
        <div style={{ width : `95%`, margin: '10px' }} >
          {(!errorMessage && alignerData?.alignments) ?
            <WordAligner
              style={{ maxHeight: `${height}px`, overflowY: 'auto' }}
              verseAlignments={alignerData?.alignments || null}
              targetWords={alignerData?.wordBank || null}
              translate={translate}
              contextId={{ reference: alignerStatus?.state?.reference || {} }}
              targetLanguage={alignerStatus?.state?.targetLanguage}
              targetLanguageFont={''}
              sourceLanguage={alignerStatus?.state?.sourceLanguage}
              showPopover={showPopover}
              lexicons={{}}
              loadLexiconEntry={getLexiconData}
              onChange={onAlignmentChange}
            />
            : // if error, then show message
            <div style={{ textAlign: 'center', fontSize: '1.5em', fontStyle: 'italic', fontWeight: 'bold' }}>
              { errorMessage || '' }
            </div>
          }
        </div>
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
