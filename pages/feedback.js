import { useContext, useState } from 'react'
import { useRouter } from 'next/router'
import Paper from 'translation-helps-rcl/dist/components/Paper'
import { makeStyles } from '@material-ui/core/styles'
import FormControl from '@material-ui/core/FormControl'
import InputLabel from '@material-ui/core/InputLabel'
import TextField from '@material-ui/core/TextField'
import MenuItem from '@material-ui/core/MenuItem'
import Select from '@material-ui/core/Select'
import Button from '@material-ui/core/Button'
import MuiAlert from '@material-ui/lab/Alert'
import CloseIcon from '@material-ui/icons/Close'
import Layout from '@components/Layout'
import { StoreContext } from '@context/StoreContext'
import { getBuildId } from '@utils/build'
import { getUserItem, getUserKey } from '@hooks/useUserLocalStorage'
import { processNetworkError, showNetworkErrorPopup } from '@utils/network'
import { CLOSE } from '@common/constants'

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

const SettingsPage = () => {
  const classes = useStyles()
  const router = useRouter()
  const categories = ['Bug Report', 'Feedback']
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)
  const [category, setCategory] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [networkError, setNetworkError] = useState(null)

  const {
    state: {
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
    },
  } = useContext(StoreContext)

  /**
   * in the case of a network error, process and display error dialog
   * @param {string} errorMessage - optional error message returned
   * @param {number} httpCode - http code returned
   */
  function processError(errorMessage, httpCode=0) {
    processNetworkError(errorMessage, httpCode, setNetworkError, null, null )
  }

  function onClose() {
    router.push('/')
  }

  function onCategoryChange(e) {
    setCategory(e.target.value)
  }

  function onNameChange(e) {
    setName(e.target.value)
  }

  function onEmailChange(e) {
    setEmail(e.target.value)
  }

  function onMessageChange(e) {
    setMessage(e.target.value)
  }

  function getUserSettings(username, baseKey) {
    const key = getUserKey(username, baseKey)
    const savedValue = getUserItem(key)
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

    console.log(`onSubmitFeedback() - sending data:`, extraData)

    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, email, category, message, extraData,
      }),
    })

    const response = await res.json()
    console.log(`onSubmitFeedback() - response status = ${res.status}, res.json = ${JSON.stringify(response)}`)

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

  return (
    <Layout>
      <div className='flex flex-col justify-center items-center w-full h-full'>
        <div className='flex justify-center items-center w-full h-full px-4 lg:w-132 lg:p-0'>
          <Paper className='flex flex-col h-auto w-full p-4 my-2'>
            <div className='flex flex-row'>
              <h3 className='flex-auto text-xl text-gray-600 font-semibold mx-8 mb-0'>
                Submit a Bug Report or Feedback
              </h3>
              <CloseIcon
                id='settings_card_close'
                className={`cursor-pointer flex-none mt-4 mr-7 mb-0`}
                onClick={onClose}
              />
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
          </Paper>
        </div>
      </div>
      { showNetworkErrorPopup({
        networkError,
        setNetworkError,
        router,
        noActionButton: true,
        closeButtonStr: CLOSE,
      }) }
    </Layout>
  )
}

export default SettingsPage
