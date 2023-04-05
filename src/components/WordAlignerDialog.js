import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import { RxLink2, RxLinkBreak2 } from 'react-icons/rx'
import { CgCloseR } from 'react-icons/cg'
import { WordAligner } from 'word-aligner-rcl'
import Button from '@mui/material/Button'
import { IconButton } from '@mui/material'
import Paper from '@mui/material/Paper'
import Draggable from 'react-draggable'

const alignmentIconStyle = { marginLeft:'50px' }

function PaperComponent(props) {
  return (
    <Draggable
      handle="#draggable-aligner-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper {...props} />
    </Draggable>
  )
}

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

  /**
   * called on every alignment change.  We save this new alignment state so that it can be applied if user clicks accept.
   *   We also update the aligned status so that the UI can be updated dynamically
   * @param {object} results
   */
  function onAlignmentChange(results) {
    const onAlignmentsChange = alignerStatus?.actions?.onAlignmentsChange;
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

  const alignerData = alignerStatus?.state?.alignerData

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
  }

  function saveAlignment() {
    const saveAlignment = alignerStatus?.actions?.saveAlignment
    saveAlignment?.(alignmentChange)
  }

  return (
    <>
      <Dialog
        fullWidth={true}
        maxWidth={'lg'}
        onClose={() => {}}
        open={alignerData}
        PaperComponent={PaperComponent}
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
        </div>
        <span style={{ width : `95%`, height: '60px', display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
          <Button variant="outlined" style={{ margin: '10px 100px' }} onClick={cancelAlignment}>
            Cancel
          </Button>
          <Button variant="outlined" style={{ margin: '10px 100px' }} onClick={saveAlignment}>
            Accept
          </Button>
        </span>
      </Dialog>

      {/** Lexicon Popup dialog */}
      <Dialog
        onClose={() => setLexiconData(null)}
        open={lexiconData}
      >
        <DialogTitle>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
            {lexiconData?.PopoverTitle || ''}
            <IconButton
              key='lexicon-close-button'
              onClick={() => setLexiconData(null)}
              title={'Close Lexicon'}
              aria-label={'Close Lexicon'}
              style={{ cursor: 'pointer' }}
            >
              <CgCloseR id='lexicon-close-icon' color='black' />
            </IconButton>
          </div>
        </DialogTitle>
        <hr style={{ borderWidth: 'thin', borderColor: 'lightgray', width: '94%' }} />
        <div style={{ margin: '10px', marginTop: '0' }}>
          {lexiconData?.wordDetails || ''}
        </div>
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