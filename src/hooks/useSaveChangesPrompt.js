import { useState, useEffect } from 'react'

export default function useSaveChangesPrompt() {
  const [savedChanges, setSavedChanges] = useState(true)
  const promptText = 'Changes you made may not be locally backed up. Do you wish to continue?'

  const showSaveChangesPrompt = () => {
    if (savedChanges) {
      return true
    } else {
      if (window.confirm(promptText)) {
        return true
      }
    }
  }

  useEffect(() => {
    const handleBeforeunload = (event) => {
      // Chrome requires `returnValue` to be set.
      if (event.defaultPrevented) {
        event.returnValue = ''
      }

      if (typeof returnValue === 'string') {
        event.returnValue = promptText
        return promptText
      }
    }

    if (!savedChanges) {
      window.addEventListener('beforeunload', handleBeforeunload)
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeunload)
    }
  }, [savedChanges])

  return {
    savedChanges,
    setSavedChanges,
    showSaveChangesPrompt,
  }
}
