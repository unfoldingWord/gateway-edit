import { useContext } from 'react'
import Layout from '@components/Layout'
import { AuthenticationContext } from 'gitea-react-toolkit'
import TranslationSettings from '@components/TranslationSettings'

const SettingsPage = () => {
  const { state: authentication } = useContext(AuthenticationContext)

  return (
    <Layout>
      <div className='flex flex-col justify-center items-center'>
        <div className='flex flex-col w-full px-4 lg:w-132 lg:p-0'>
          <h1>Account Settings</h1>
          <TranslationSettings authentication={authentication} />
        </div>
      </div>
    </Layout>
  )
}

export default SettingsPage
