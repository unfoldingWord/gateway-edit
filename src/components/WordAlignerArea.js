import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import DialogTitle from '@mui/material/DialogTitle'
import { RxLink2, RxLinkBreak2 } from 'react-icons/rx'
import { AlignmentHelpers, WordAligner } from 'word-aligner-rcl'
import * as isEqual from "deep-equal";
import cloneDeep from "lodash.clonedeep";

// popup dialog for user to align verse
export default function WordAlignerArea({
  aligned,
  alignmentIconStyle,
  contextId,
  lexiconCache,
  loadLexiconEntry,
  onChange,
  showPopover,
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

  useEffect(() => {
    console.log('WordAlignerArea: initialized')
  }, [])

  useEffect(() => {
    if (aligned !== aligned_) {
      console.log('WordAlignerArea: set alignment to', aligned)
      setAligned(aligned)
    }
  }, [aligned])

  function onAlignmentChange(results) {
    // const onAlignmentsChange = alignerStatus?.actions?.onAlignmentsChange
    // const alignmentComplete = onAlignmentsChange?.(results)
    const alignmentComplete = AlignmentHelpers.areAlgnmentsComplete(results.targetWords, results.verseAlignments);
    setAlignmentChange(results) // save the most recent change
    setAligned(alignmentComplete) // update alignment complete status
  }

  return (
    <>
      <DialogTitle style={{ cursor: 'move' }} id="draggable-aligner-dialog-title" >
          <span>
            {`Aligning: ${title}`}
            {aligned_? (
              <RxLink2 style={alignmentIconStyle} id='valid_icon' color='#BBB' />
            ) : (
              <RxLinkBreak2 style={alignmentIconStyle} id='invalid_icon' color='#000' />
            )}
          </span>
      </DialogTitle>
      <div style={{ width : `95%`, margin: '10px' }} >
        <WordAligner
          style={style}
          verseAlignments={verseAlignments}
          targetWords={targetWords}
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

    </>
  )
}

WordAlignerArea.propTypes = {
  aligned: PropTypes.bool,
  contextId: PropTypes.object.isRequired,
  lexiconCache: PropTypes.object,
  loadLexiconEntry: PropTypes.func.isRequired,
  onChange: PropTypes.func,
  showPopover: PropTypes.func.isRequired,
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

