import { useContext } from 'react'
import Button from '@material-ui/core/Button'
import SaveIcon from '@material-ui/icons/Save'
import { AuthenticationContext } from 'gitea-react-toolkit'
import TranslationSettings from '@components/TranslationSettings'
import { StoreContext } from '@context/StoreContext'

const SettingsPage = () => {
  const { state: authentication } = useContext(AuthenticationContext)
  const {
    actions: {
      setShowAccountSetup
    },
  } = useContext(StoreContext)

  return (
    <div className='flex flex-col justify-center items-center'>
      <div className='flex flex-col w-full px-4 lg:w-132 lg:p-0'>
        <h1 className='mx-4'>Account Settings</h1>
        <TranslationSettings authentication={authentication} />
        <div className='flex justify-end'>
          <Button
            size='large'
            color='primary'
            className='my-3'
            variant='contained'
            onClick={() => setShowAccountSetup(false)}
            startIcon={<SaveIcon />}
          >
            Save and Continue
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
