import { useState } from 'react'
import Paper from 'translation-helps-rcl/dist/components/Paper'
import { makeStyles } from '@material-ui/core/styles'
import FormControl from '@material-ui/core/FormControl'
import InputLabel from '@material-ui/core/InputLabel'
import TextField from '@material-ui/core/TextField'
import MenuItem from '@material-ui/core/MenuItem'
import Select from '@material-ui/core/Select'
import Button from '@material-ui/core/Button'
import Layout from '@components/Layout'
// import sendFeedback from '@common/sendFeedback'

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
}))

const SettingsPage = () => {
  const classes = useStyles()
  const categories = ['Bug Report', 'Feedback']
  const [category, setSategory] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  function onCategoryChange(e) {
    setSategory(e.target.value)
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

  async function onSubmitFeedback() {
    console.log({ name, email, category, message })
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, category, message }),
    }).catch(e => console.log(e))

    console.log('res', res)
  }

  return (
    <Layout>
      <div className='flex flex-col justify-center items-center w-full h-full'>
        <div className='flex justify-center items-center w-full h-full px-4 lg:w-132 lg:p-0'>
          <Paper className='flex flex-col h-auto w-full p-4 my-2'>
            <h3 className='text-xl text-gray-600 font-semibold mx-8 mb-0'>
              Submit a Bug Report or Feedback
            </h3>
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
              <div className='flex justify-end mx-8 mb-4'>
                <Button
                  className={classes.button}
                  variant='contained'
                  color='primary'
                  disableElevation
                  disabled={!name || !email || !message || !category}
                  onClick={onSubmitFeedback}
                >
                  Submit
                </Button>
              </div>
            </div>
          </Paper>
        </div>
      </div>
    </Layout>
  )
}

export default SettingsPage
