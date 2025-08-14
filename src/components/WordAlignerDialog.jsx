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
  const [showDialog, setShowDialog] = useState({})
  const dialogRef = useRef(null) // for keeping track of  aligner dialog position

  const alignerData_ = alignerStatus?.state?.alignerData || null
  const shouldShowDialog = !!(alignerData_?.alignments && alignerData_?.wordBank)

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

  useEffect(() => { // set initial aligned state
   if (alignerData_) {
      setAligned(!!alignerStatus?.state?.aligned)
    }
  }, [alignerData_])

  useEffect(() => {
    console.log('WordAlignerDialog: aligner data changed')

    if (showDialog !== shouldShowDialog) {
      console.log('WordAlignerDialog: aligner visible state changed')
      setShowDialog(shouldShowDialog)
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
    bookId,
    chapter,
    verse,
  } = alignerStatus?.state?.reference || {}
  const title = `${bookId?.toUpperCase()} ${chapter}:${verse} in ${alignerStatus?.state?.title}`

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
      reference: alignerStatus?.state?.reference || {},
      tool: "wordAlignment",
      bibleId
    };
  }, [alignerStatus?.state?.reference, owner, alignerData_?.scriptureConfig?.resourceLink]);

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
          alignmentActions={alignerStatus?.actions}
          errorMessage={errorMessage}
          title={title || ''}
          style={{ maxHeight: `${height}px`, overflowY: 'auto' }}
          verseAlignments={alignerData_?.alignments || []}
          targetWords={alignerData_?.wordBank || []}
          translate={translate}
          contextId={contextId}
          targetLanguage={alignerStatus?.state?.targetLanguage || ''}
          targetLanguageFont={''}
          sourceLanguage={alignerStatus?.state?.sourceLanguage || ''}
          lexiconCache={{}}
          loadLexiconEntry={getLexiconData}
          translationMemory={translationMemory}
          showingDialog={!!showDialog}
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
  originalBibleBookUsfm: PropTypes.string,
  owner: PropTypes.string,
}

export default React.memo(WordAlignerDialog)
