import { useContext, useMemo } from 'react'
import PropTypes from 'prop-types'
import { AuthenticationContext } from 'gitea-react-toolkit'
import Header from '@components/Header'
import Footer from '@components/Footer'
import Onboarding from '@components/Onboarding'
import { StoreContext } from '@context/StoreContext'
import { getBuildId } from '@utils/build'
import { appName } from '@common/constants'
import useValidateAccountSettings from '@hooks/useValidateAccountSettings'

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
  useValidateAccountSettings(authentication, showAccountSetup, languageId, owner, setShowAccountSetup)

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

Layout.propTypes = {
  title: PropTypes.string,
  showChildren: PropTypes.bool,
  children: PropTypes.node.isRequired,
}
