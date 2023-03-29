import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import { RxLink2, RxLinkBreak2 } from 'react-icons/rx'
import { WordAligner } from 'word-aligner-rcl'
import Button from '@mui/material/Button'

const alignmentIconStyle = { marginLeft:'50px' }

// popup dialog for user to align verse
export default function WordAlignerDialog({
  alignerStatus,
  height,
  translate,
  showPopover,
  getLexiconData,
}) {
  const [alignmentChange, setAlignmentChange] = useState(null)
  const [aligned, setAligned] = useState(false)

  /**
   * called on every alignment change.  We save this new alignment state so that it can be applied if user clicks accept.
   *   We also update the aligned status so that the UI can be updated dynamically
   * @param {object} results
   */
  function onAlignmentChange(results) {
    const alignmentComplete = alignerStatus?.actions?.onAlignmentsChange(results)
    setAlignmentChange(results) // save the most recent change
    setAligned(alignmentComplete) // update alignment complete status
  }

  const alignerData = alignerStatus?.state?.alignerData

  useEffect(() => { // set initial aligned state
    if (alignerData) {
      setAligned(!!alignerStatus?.state?.aligned)
    }
  }, [alignerData, alignerStatus])

  return (
    <Dialog
      fullWidth={true}
      maxWidth={'lg'}
      onClose={() => {}}
      open={alignerData}
    >
      <DialogTitle>
        <span>
          {`Aligning: ${alignerStatus?.state?.title}`}
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
        <Button variant="outlined" style={{ margin: '10px 100px' }} onClick={() => alignerStatus?.actions?.cancelAlignment()}>
          Cancel
        </Button>
        <Button variant="outlined" style={{ margin: '10px 100px' }} onClick={() => alignerStatus?.actions?.saveAlignment(alignmentChange)}>
          Accept
        </Button>
      </span>
    </Dialog>
  )
}

WordAlignerDialog.propTypes = {
  alignerStatus: PropTypes.object.isRequired,
  height: PropTypes.number.isRequired,
  translate: PropTypes.func.isRequired,
  showPopover: PropTypes.func.isRequired,
  getLexiconData: PropTypes.func.isRequired,
}
