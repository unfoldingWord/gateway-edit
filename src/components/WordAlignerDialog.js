import React, {
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import PropTypes from 'prop-types'
import cloneDeep from 'lodash.clonedeep'
import Dialog from '@mui/material/Dialog'
import Paper from '@mui/material/Paper'
import Draggable from 'react-draggable'
import { useBoundsUpdater } from 'translation-helps-rcl'
import { StoreContext } from '@context/StoreContext'
import WordAlignerArea from './WordAlignerArea';

// popup dialog for user to align verse
export default function WordAlignerDialog({
  alignerStatus,
  height,
  translate,
  getLexiconData,
}) {
  const [aligned, setAligned] = useState(false)
  const [dialogState, setDialogState_] = useState({})
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

  const errorMessage = alignerStatus?.state?.errorMessage

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
          alignmentActions={alignerStatus?.actions}
          errorMessage={errorMessage}
          title={title || ''}
          style={{ maxHeight: `${height}px`, overflowY: 'auto' }}
          verseAlignments={dialogState?.alignments || []}
          targetWords={dialogState?.wordBank || []}
          translate={translate}
          contextId={{ reference: alignerStatus?.state?.reference || {} }}
          targetLanguage={alignerStatus?.state?.targetLanguage || ''}
          targetLanguageFont={''}
          sourceLanguage={alignerStatus?.state?.sourceLanguage || ''}
          lexiconCache={{}}
          loadLexiconEntry={getLexiconData}
        />

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
