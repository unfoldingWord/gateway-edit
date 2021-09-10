import { useState, useEffect } from 'react'

export default function useSaveChangesPrompt() {
  const [unsavedResources, setUnsavedResources] = useState([])
  const savedChanges = !(unsavedResources.length > 0)
  const promptText = 'Changes you made may not be saved. Do you wish to continue?'

  const setSavedChanges = (resourceId, saved) => {
    if (!saved) {
      setUnsavedResources(prevState => {
        const newUnsavedResources = [...prevState]
        const found = newUnsavedResources.find(element => element === resourceId)

        if (!found) {
          newUnsavedResources.push(resourceId)
        }

        return newUnsavedResources
      })
    } else {
      setUnsavedResources(prevState => {
        let newUnsavedResources = [...prevState]
        newUnsavedResources = newUnsavedResources.filter(r => r !== resourceId)

        return newUnsavedResources
      })
    }
  }

  const showSaveChangesPrompt = (resourceId, setContent) => new Promise((resolve, reject) => {
    if (savedChanges) {
      resolve()
    } else {
      if (unsavedResources.includes(resourceId)) {
        if (window.confirm(promptText)) {
          setUnsavedResources(prevState => {
            let newUnsavedResources = [...prevState]
            newUnsavedResources = newUnsavedResources.filter(r => r !== resourceId)

            return newUnsavedResources
          })
          setContent('')
          resolve()
        } else {
          reject()
        }
      } else {
        resolve()
      }
    }
  })

  const checkUnsavedChanges = () => new Promise((resolve) => {
    if (savedChanges) {
      resolve(true)
    } else {
      if (window.confirm(promptText)) {
        setUnsavedResources([])
        resolve(true)
      } else {
        resolve(false)
      }
    }
  })

  useEffect(() => {
    const handleBeforeunload = (event) => {
      event.preventDefault()

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
    checkUnsavedChanges,
    showSaveChangesPrompt,
  }
}
