import { useContext, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import { AuthenticationContext } from 'gitea-react-toolkit'
import Header from '@components/Header'
import Footer from '@components/Footer'
import Onboarding from '@components/Onboarding'
import { StoreContext } from '@context/StoreContext'
import { getBuildId } from '@utils/build'
import { APP_NAME, BASE_URL, PROD, QA, QA_BASE_URL } from '@common/constants'
import useValidateAccountSettings from '@hooks/useValidateAccountSettings'
import { useRouter } from 'next/router'

export default function Layout({
  children,
  showChildren,
  title = APP_NAME,
}) {
  const router = useRouter()
  const {
    state: authentication,
    component: authenticationComponent,
  } = useContext(AuthenticationContext)

  const {
    state: {
      showAccountSetup,
      languageId,
      owner,
      server,
    },
    actions: {
      setCurrentLayout,
      setShowAccountSetup,
      setServer,
    },
  } = useContext(StoreContext)

  useEffect(() => {
    const params = router?.query

    if (typeof params?.server === 'string') { // if URL param given
      const serverID_ = params.server.toUpperCase() === QA ? QA : PROD
      const server_ = (serverID_ === QA) ? QA_BASE_URL : BASE_URL

      if (server !== server_) {
        console.log(`_app.js - On init switching server to: ${serverID_}, url server param '${params.server}', old server ${server}, reloading page`)
        setServer(server_) // persist server selection in localstorage
        router.push(`/?server=${serverID_}`) // reload page
      }
    }
  }, [router?.query]) // TRICKY query property not loaded on first pass, so watch for change

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
        serverID={(server === QA_BASE_URL) ? QA : ''}
      />
    </div>
  )
}

Layout.propTypes = {
  title: PropTypes.string,
  showChildren: PropTypes.bool,
  children: PropTypes.node.isRequired,
}
