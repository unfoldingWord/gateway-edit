import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { makeStyles } from '@material-ui/core/styles'
import FormControl from '@material-ui/core/FormControl'
import InputLabel from '@material-ui/core/InputLabel'
import TextField from '@material-ui/core/TextField'
import MenuItem from '@material-ui/core/MenuItem'
import Select from '@material-ui/core/Select'
import Button from '@material-ui/core/Button'
import MuiAlert from '@material-ui/lab/Alert'
import { getBuildId } from '@utils/build'
import { getLocalStorageItem, getUserKey } from '@hooks/useUserLocalStorage'
import { processNetworkError } from '@utils/network'
import { CLOSE, HTTP_GET_MAX_WAIT_TIME } from '@common/constants'
import NetworkErrorPopup from '@components/NetworkErrorPopUp'
import { DraggableCard } from 'translation-helps-rcl'
import PropTypes from 'prop-types'

function Alert({ severity, message }) {
  const router = useRouter()

  return (
    <MuiAlert
      className='w-full mt-8 mb-4'
      elevation={6}
      variant='filled'
      severity={severity}
      action={
        severity === 'success' && (
          <Button color='inherit' size='small' onClick={() => router.push('/')}>
            OK
          </Button>
        )
      }
    >
      {message}
    </MuiAlert>
  )
}

const useStyles = makeStyles(theme => ({
  textField: {
    display: 'flex',
    flexDirection: 'column',
    margin: theme.spacing(4),
  },
  formControl: {
    display: 'flex',
    flexDirection: 'column',
    margin: theme.spacing(4),
  },
  button: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
}))

const FeedbackPopup = ({
  owner,
  server,
  branch,
  taArticle,
  languageId,
  selectedQuote,
  scriptureOwner,
  bibleReference,
  supportedBibles,
  currentLayout,
  lastError,
  loggedInUser,
  open,
  onClose,
}) => {
  const classes = useStyles()
  const categories = ['Bug Report', 'Feedback']
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)
  const [category, setCategory] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState(null)
  const [showEmailError, setShowEmailError] = useState(false)
  const [message, setMessage] = useState('')
  const [networkError, setNetworkError] = useState(null)
  const emailEditRef = useRef(null)

  /**
   * in the case of a network error, process and display error dialog
   * @param {string|Error} error - initial error message message or object
   * @param {number} httpCode - http code returned
   */
  function processError(error, httpCode=0) {
    processNetworkError(error, httpCode, null, null, setNetworkError, null, null )
  }

  function onCategoryChange(e) {
    setCategory(e.target.value)
  }

  function onNameChange(e) {
    setName(e.target.value)
  }

  function onEmailChange(e) {
    const validationError = e?.target?.validationMessage || null
    setEmailError(validationError)

    if (!validationError) { // if email address error corrected, then clear any displayed warning
      setShowEmailError(false)
    }
    setEmail(e.target.value)
  }

  function onMessageChange(e) {
    setMessage(e.target.value)
  }

  function getUserSettings(username, baseKey) {
    const key = getUserKey(username, baseKey)
    const savedValue = getLocalStorageItem(key)
    return savedValue
  }

  function getScriptureCardSettings(username) {
    const settings = ['scripturePaneTarget', 'scripturePaneConfig', 'scripturePaneFontSize']
    const cards = []

    for (let i = 0; ; i++) {
      const cardSettings = {}

      for (let j = 0; j < settings.length; j++) {
        const settingKey = settings[j]
        const savedValue = getUserSettings(username, `${settingKey}_${i}`)

        if (savedValue !== null) {
          cardSettings.settingKey = savedValue
        } else {
          break
        }
      }

      if (Object.keys(cardSettings).length > 0) {
        cards.push(cardSettings)
      } else {
        break
      }
    }
    return cards
  }

  async function onSubmitFeedback() {
    setSubmitting(true)
    setShowSuccess(false)

    if (emailError) { // if there is currently an error on the email address, show to user and abort submitting feedback
      setShowEmailError(true)
      emailEditRef.current.focus()
      return
    }

    setSubmitting(true)
    setShowError(false)
    const build = getBuildId()
    const scriptureCardSettings = getScriptureCardSettings(loggedInUser)
    const scriptureVersionHistory = getUserSettings(loggedInUser, `scriptureVersionHistory`)

    const extraData = JSON.stringify({
      lastError,
      loggedInUser,
      build,
      owner,
      server,
      branch,
      taArticle,
      languageId,
      selectedQuote,
      scriptureOwner,
      bibleReference,
      supportedBibles,
      currentLayout,
      scriptureCardSettings,
      scriptureVersionHistory,
    })

    let res

    try {
      const fetchPromise = fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, category, message, extraData,
        }),
      })
      const timeout = new Promise((_r, rej) => {
        const TIMEOUT_ERROR = `Network Timeout Error ${HTTP_GET_MAX_WAIT_TIME}ms`
        return setTimeout(() => rej(TIMEOUT_ERROR), HTTP_GET_MAX_WAIT_TIME)
      })
      res = await Promise.race([fetchPromise, timeout])
    } catch (e) {
      console.warn(`onSubmitFeedback() - failure calling '/api/feedback'`, e)
      processError(e)
      setSubmitting(false)
      setShowSuccess(false)
      setShowError(true)
      return
    }

    const response = await res.json()

    if (res.status === 200) {
      setShowSuccess(true)
    } else {
      const error = response.error
      console.warn(`onSubmitFeedback() - error response = ${JSON.stringify(error)}`)
      const httpCode = parseInt(error.code, 10)
      const errorMessage = error.message + '.'
      setShowError(true)
      processError(errorMessage, httpCode)
    }

    setSubmitting(false)
  }

  function getFeedbackContents() {
    return (
      <>
        <div className='flex flex-col h-auto w-full p-4 my-2'>
          <div className='flex flex-row'>
            <h3 className='flex-auto text-xl text-gray-600 font-semibold mx-8 mb-0'>
              Submit a Bug Report or Feedback
            </h3>
          </div>
          <div>
            <TextField
              id='name-feedback-form'
              type='given-name'
              label='Name'
              autoComplete='name'
              defaultValue={name}
              variant='outlined'
              onChange={onNameChange}
              classes={{ root: classes.textField }}
            />
            <TextField
              id='Email-feedback-form'
              type='email'
              label='Email'
              autoComplete='email'
              defaultValue={email}
              variant='outlined'
              onChange={onEmailChange}
              classes={{ root: classes.textField }}
              error={showEmailError}
              helperText={showEmailError ? emailError : null}
              inputRef={emailEditRef}
            />
            <FormControl variant='outlined' className={classes.formControl}>
              <InputLabel id='categories-dropdown-label'>
                Category:
              </InputLabel>
              <Select
                id='categories-dropdown'
                value={category}
                onChange={onCategoryChange}
                label='Category'
              >
                {categories.map((label, i) => (
                  <MenuItem key={`${label}-${i}`} value={label}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              id='message-feedback-form'
              type='text'
              label='Message'
              multiline
              rows={4}
              defaultValue={message}
              variant='outlined'
              onChange={onMessageChange}
              classes={{ root: classes.textField }}
            />
            <div className='flex flex-col mx-8 mb-4'>
              <Button
                className='self-end'
                variant='contained'
                color='primary'
                size='large'
                disableElevation
                disabled={
                  submitting || !name || !email || !message || !category
                }
                onClick={onSubmitFeedback}
              >
                {submitting ? 'Submitting' : 'Submit'}
              </Button>
              {showSuccess || showError ? (
                <Alert
                  severity={showSuccess ? 'success' : 'error'}
                  message={
                    showSuccess
                      ? `Your ${
                        category || 'feedback'
                      } was submitted successfully!`
                      : `Something went wrong submitting your ${
                        category || 'feedback'
                      }.`
                  }
                />
              ) : null}
            </div>
          </div>
        </div>
        { !!networkError &&
          <NetworkErrorPopup
            networkError={networkError}
            setNetworkError={setNetworkError}
            closeButtonStr={CLOSE}
          />
        }
      </>
    )
  }

  return (
    <DraggableCard
      open={open}
      showRawContent
      content={open ? getFeedbackContents() : null}
      onClose={onClose}
    />

  )
}

FeedbackPopup.propTypes = { onClose: PropTypes.func.isRequired }

export default FeedbackPopup
