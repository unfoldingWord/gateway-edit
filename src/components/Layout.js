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
    <div className='flex justify-center items-center w-full h-full'>
      {authenticationComponent}
    </div>
  )

  return (
    <div className='h-screen w-screen flex flex-col'>
      <Header
        appName='translationCore: Create'
        authentication={authentication || {}}
      />
      <main className='flex flex-1 flex-col w-auto m-0'>
        {authentication ? children : <AuthComponent />}
      </main>
      <Footer />
    </div>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}
