import { useContext, useMemo } from 'react'
import PropTypes from 'prop-types'
import { AuthenticationContext } from 'gitea-react-toolkit'
import Header from '@components/Header'
import Footer from '@components/Footer'
import Onboarding from '@components/Onboarding'
import { StoreContext } from '@context/StoreContext'
import { getBuildId } from '@utils/build'
import { appName } from '@common/constants'

export default function Layout({
  children,
  showChildren,
  title = appName,
}) {
  const {
    state: authentication,
    component: authenticationComponent,
  } = useContext(AuthenticationContext)

  const {
    state: {
      showAccountSetup,
      languageId,
      owner,
    },
    actions: {
      setCurrentLayout,
      setShowAccountSetup,
    },
  } = useContext(StoreContext)

  const buildId = useMemo(getBuildId, [])
  verifyAccountSettings(authentication, showAccountSetup, languageId, owner, setShowAccountSetup)

  return (
    <div className='h-screen w-screen flex flex-col'>
      <Header
        title={title}
        authentication={authentication || {}}
        resetResourceLayout={() => setCurrentLayout(null)}
      />
      <main className='flex flex-1 flex-col w-auto m-0 bg-gray-200'>
        {showChildren || (authentication && !showAccountSetup) ? (
          children
        ) : (
          <Onboarding
            authentication={authentication}
            authenticationComponent={authenticationComponent}
          />
        )}
      </main>
      <Footer
        buildHash={buildId?.hash}
        buildVersion={buildId?.version}
      />
    </div>
  )
}

let accountSettingsTimer = null

function verifyAccountSettings(authentication, showAccountSetup, languageId, owner, setShowAccountSetup) {
  const missingAccountSettings = (authentication && !showAccountSetup && (!languageId || !owner))

  // TRICKY - in the case we switched users, make sure we have account settings
  if (missingAccountSettings) {
    if (!accountSettingsTimer) {
      accountSettingsTimer = setTimeout(() => { // wait for account settings to update
        // timer timed out and still missing account settings
        console.log(`Layout - still missing account settings going to setup page`)
        setShowAccountSetup(true)
      }, 1000)
    }
  } else if (accountSettingsTimer) {
    // no longer missing account settings - clear timer
    clearTimeout(accountSettingsTimer)
    accountSettingsTimer = null
  }
}

Layout.propTypes = {
  title: PropTypes.string,
  showChildren: PropTypes.bool,
  children: PropTypes.node.isRequired,
}
