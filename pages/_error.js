import Error from 'next/error'
import PropTypes from 'prop-types'

export default function ErrorPage({ statusCode }) {
  if (statusCode) {
    return <Error statusCode={statusCode} />
  }

  localStorage.clear()

  return (
    <div className='flex flex-col items-center justify-center text-black bg-white font-sans h-screen text-center'>
      <div className='flex items-center justify-center text-left h-12 align-middle leading-10'>
        <div className='border-r border-t-0 border-b-0 border-l-0 border-solid border-black border-opacity-30 m-0 mr-5 py-3 pr-6 pl-0 text-2xl font-medium'>
          Error
        </div>
        <div className='text-sm font-normal m-0 p-0'>
          An unexpected error has occurred. The app cache was cleared.
        </div>
      </div>
    </div>
  )
}

ErrorPage.propTypes = { statusCode: PropTypes.number }

ErrorPage.getInitialProps = ({ res, err }) => {//eslint-disable-next-line
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}
