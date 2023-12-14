import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { AuthenticationContext } from 'gitea-react-toolkit'
import Header from '@components/Header'
import Footer from '@components/Footer'
import Onboarding from '@components/Onboarding'
import { StoreContext } from '@context/StoreContext'
import { getBuildId } from '@utils/build'
import {
  APP_NAME,
  BASE_URL,
  HOME_PAGE,
  PROD,
  QA,
  QA_BASE_URL,
  SETTINGS_PAGE,
} from '@common/constants'
import useValidateAccountSettings from '@hooks/useValidateAccountSettings'
import SettingsPage from '@components/SettingsPage'
import { reloadPage } from '@utils/pages'

export default function Layout({
  children,
  showChildren,
  title = APP_NAME,
}) {
  const mainScreenRef = useRef(null)
  const [feedback, setFeedback_] = useState(null) // contains feedback data
  const {
    state: authentication,
    component: authenticationComponent,
  } = useContext(AuthenticationContext)

  function setFeedback(enable) {
    const feedbackDisplayed = !!feedback

    if (enable !== feedbackDisplayed) {
      if (enable) {
        setFeedback_(storeContext?.state) // add state data to send as feedback
      } else {
        setFeedback_(null)
      }
    }
  }

  const storeContext = useContext(StoreContext)
  const {
    state: {
      showAccountSetup,
      languageId,
      owner,
      server,
      mergeStatusForCards,
      page,
    },
    actions: {
      setCurrentLayout,
      setShowAccountSetup,
      setServer,
      setMainScreenRef,
    },
  } = storeContext

  useEffect(() => {
    setMainScreenRef(mainScreenRef)
  }, [ mainScreenRef?.current ])

  useEffect(() => {
    if (page?.pageId) {
      switch (page.pageId) {
      case HOME_PAGE:
        reloadPage(page.pageId, page.params)
        break

      case SETTINGS_PAGE:
        showAccountSetup(true)
        break
      }
    }
  }, [ page ])

  useEffect(() => {
    const parsedUrl = new URL(window.location.href)
    const params = parsedUrl.searchParams

    if (params && typeof params.get('server') === 'string') { // if URL param given
      let serverID_ = params.get('server').toUpperCase() === QA ? QA : PROD
      let server_ = (serverID_ === QA) ? QA_BASE_URL : BASE_URL

      if (params.get('server')?.length === 0){
        server_ = (import.meta.env.VITE_PUBLIC_BUILD_CONTEXT === 'production') ? BASE_URL : QA_BASE_URL
        serverID_ = (server_ === QA_BASE_URL) ? QA : PROD
      }

      if (server !== server_) {
        console.log(
          `_app.js - On init switching server to: ${serverID_}, url server param '${params.get(
            'server',
          )}', old server ${server}, reloading page`,
        )
        setServer(server_) // persist server selection in localstorage
        reloadPage('/', `server=${serverID_}`)
      }
    }
  }, [])

  const buildId = useMemo(getBuildId, [])
  useValidateAccountSettings(authentication, showAccountSetup, languageId, owner, setShowAccountSetup)

  /**
   * determine the page to show based on state
   * @returns {*|JSX.Element}
   */
  function getDisplayPage() {
    if (showChildren || (authentication && !showAccountSetup)) {
      return children
    }

    if (authentication && showAccountSetup) {
      return (
        <SettingsPage/>
      )
    }

    return (
      <Onboarding
        authentication={authentication}
        authenticationComponent={authenticationComponent}
      />
    )
  }

  return (
    <div
      className='h-screen w-screen flex flex-col'
      ref={mainScreenRef}
    >
      <Header
        title={title}
        authentication={authentication || {}}
        resetResourceLayout={() => setCurrentLayout(null)}
        feedback={feedback}
        setFeedback={setFeedback}
        mergeStatusForCards={mergeStatusForCards}
      />
      <main className='flex flex-1 flex-col w-auto m-0 bg-gray-200'>
        {getDisplayPage()}
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
