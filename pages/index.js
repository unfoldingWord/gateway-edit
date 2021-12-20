import dynamic from 'next/dynamic'
import Layout from '@components/Layout'
import CircularProgress from '@components/CircularProgress'

const WorkspaceContainer = dynamic(
  () => import('@components/WorkspaceContainer'),
  {
    ssr: false,
    loading: () => <CircularProgress size={180} />,
  },
)

const Home = () => (
  <Layout>
    <WorkspaceContainer />
  </Layout>
)

export default Home
