import { useContext } from 'react'
import PropTypes from 'prop-types'
import { AuthenticationContext } from 'gitea-react-toolkit'
import Header from '@components/Header'
import Footer from '@components/Footer'

export default function Layout({ children }) {
  const {
    state: authentication,
    component: authenticationComponent,
  } = useContext(AuthenticationContext)

  const AuthComponent = () => (
    <div className='flex justify-center items-center h-full w-full'>
      <div className='flex justify-center items-center h-104 w-104 bg-white p-10 sm:h-116 sm:w-116'>
        {authenticationComponent}
      </div>
    </div>
  )

  return (
    <div className='h-screen w-screen flex flex-col'>
      <Header
        appName='translationCore: Create'
        authentication={authentication || {}}
      />
      <main className='flex flex-1 flex-col w-auto m-0 bg-gray-200'>
        {authentication ? children : <AuthComponent />}
      </main>
      <Footer />
    </div>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}
