import dynamic from 'next/dynamic'
import Layout from '@components/Layout'
import CircularProgress from '@components/CircularProgress'
import { useRouter } from 'next/router'
import { useContext, useEffect } from 'react'
import {
  BASE_URL,
  PROD, QA,
  QA_BASE_URL,
} from '@common/constants'
import { AuthContext } from '@context/AuthContext'

const WorkspaceContainer = dynamic(
  () => import('@components/WorkspaceContainer'),
  {
    ssr: false,
    loading: () => <CircularProgress size={180} />,
  }
)

const Home = () => {
  const router = useRouter()
  const {
    state: { server },
    actions: { setServer },
  } = useContext(AuthContext)

  useEffect(() => {
    const params = router.query

    if (typeof params.server === 'string') { // if URL param given
      const serverID_ = params.server.toUpperCase() === QA ? QA : PROD
      const server_ = (serverID_ === QA) ? QA_BASE_URL : BASE_URL

      if (server !== server_) {
        console.log(`index.js - On init switching server to: ${serverID_}, url server param ${params.server}, reloading page`)
        setServer(server_)
        router.push(`/?server=${serverID_}`) // reload page with new server
      }
    }
  }, [router.query]) // TRICKY query property not loaded on first pass, so watch for change

  return (
    <Layout>
      <WorkspaceContainer/>
    </Layout>
  )
}

export default Home
