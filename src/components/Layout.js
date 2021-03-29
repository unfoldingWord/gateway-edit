import { useContext, useMemo } from 'react'
import PropTypes from 'prop-types'
import { AuthenticationContext } from 'gitea-react-toolkit'
import Header from '@components/Header'
import Footer from '@components/Footer'
import Onboarding from '@components/Onboarding'
import { StoreContext } from '@context/StoreContext'
import { getBuildId } from '@utils/build'
import { appName } from "@common/constants";

export default function Layout({
  children,
  title = appName,
}) {
  const {
    state: authentication,
    component: authenticationComponent,
  } = useContext(AuthenticationContext)

  const {
    state: { showAccountSetup },
    actions: { setCurrentLayout },
  } = useContext(StoreContext)

  const buildId = useMemo(getBuildId, [])

  return (
    <div className='h-screen w-screen flex flex-col'>
      <Header
        title={title}
        authentication={authentication || {}}
        resetResourceLayout={() => setCurrentLayout(null)}
      />
      <main className='flex flex-1 flex-col w-auto m-0 bg-gray-200'>
        {authentication && !showAccountSetup ? (
          children
        ) : (
          <Onboarding
            authentication={authentication}
            authenticationComponent={authenticationComponent}
          />
        )}
      </main>
      <Footer
        buildVersion = {buildId?.version}
        buildHash = {buildId?.hash}
      />
    </div>
  )
}

Layout.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
}
