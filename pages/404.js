import Error from 'next/error'
import PropTypes from 'prop-types'
import Layout from '@components/Layout'

export default function ErrorPage() {
  return (
    <Layout showChildren>
      <Error statusCode={404} />
    </Layout>
  )
}

ErrorPage.propTypes = { statusCode: PropTypes.number }
