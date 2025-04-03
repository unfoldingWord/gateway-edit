import React, { useContext } from 'react'
import { AuthenticationContext } from 'gitea-react-toolkit'
import { useAppNavigation } from '../hooks/useAppNavigation'
import TranslationSettings from '@components/TranslationSettings'
import Button from '@material-ui/core/Button'
import SaveIcon from '@material-ui/icons/Save'

export default function AccountSettings() {
  const { navigate } = useAppNavigation()
  const { state: authentication } = useContext(AuthenticationContext)

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
            onClick={() => navigate('/')}
            startIcon={<SaveIcon />}
          >
            Save and Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
