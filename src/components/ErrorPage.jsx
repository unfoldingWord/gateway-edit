import { useContext } from 'react'
import PropTypes from 'prop-types'
import { StoreContext } from '@context/StoreContext'

export default function ErrorPage({ statusCode }) {
  const {
    actions: {
      setPage
    },
  } = useContext(StoreContext)

  if (statusCode) {
    return <div>{`Error ${statusCode}`}</div>
  }

  localStorage.clear()

  const handleClick = (e) => {
    e.preventDefault()
    setPage('/')
  }

  return (
    <div className='flex flex-col items-center justify-center h-full text-black font-sans text-center'>
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="500px"
        height="350px"
        viewBox="0 0 512 512"
        fill='currentColor'
        xmlSpace="preserve"
      >
        <path fill='#FF6B6B' d="M471.929,480.979H40.074c-30.883,0-50.135-33.478-34.552-60.175L221.449,50.871c15.427-26.43,53.649-26.478,69.104,0L506.48,420.805C522.049,447.477,502.84,480.979,471.929,480.979z"/>
        <path fill='#EE5253' d="M250.776,67.988L34.849,437.922c-2.361,4.046,0.532,9.099,5.225,9.099h431.855c4.684,0,7.591-5.046,5.225-9.099L261.226,67.988C258.889,63.984,253.127,63.96,250.776,67.988z"/>
        <path fill='#E4EAF8' d="M256.109,358.131c9.98,0,18.411,8.305,18.411,18.134c0,9.7-8.431,17.895-18.411,17.895c-10.271,0-18.627-8.028-18.627-17.895C237.482,366.435,246.012,358.131,256.109,358.131z"/>
        <path fill='#E4EAF8' d="M256.109,330.134c-10.33,0-17.544-5.003-17.544-12.166V216.821c0-5.99,7.05-12.404,17.544-12.404c9.461,0,17.761,5.797,17.761,12.404v101.147C273.87,325.017,266.401,330.134,256.109,330.134z"/>
        <path fill='#EE5253' d="M26.127,420.805L242.054,50.871c5.464-9.361,14.148-15.875,24.25-18.52c-16.842-4.409-35.352,2.238-44.855,18.52L5.522,420.805c-15.569,26.671,3.641,60.175,34.552,60.175h20.605C29.794,480.979,10.545,447.499,26.127,420.805z"/>
        <path fill='#E24951' d="M55.454,437.922l210.85-361.235l-5.078-8.699c-2.341-4.012-8.103-4.02-10.45,0L34.849,437.922c-2.362,4.046,0.532,9.099,5.225,9.099h20.605C55.994,447.022,53.088,441.976,55.454,437.922z"/>
        <path fill='#D8DCE5' d="M258.087,376.265c0-6.13,3.319-11.665,8.265-14.965c-2.95-1.991-6.486-3.169-10.242-3.169c-10.097,0-18.627,8.305-18.627,18.134c0,9.868,8.356,17.896,18.627,17.896c3.726,0,7.234-1.144,10.17-3.08C261.339,387.859,258.087,382.421,258.087,376.265z"/>
        <path fill='#D8DCE5' d="M259.17,317.968V216.821c0-3.696,2.69-7.548,7.21-9.96c-2.945-1.518-6.511-2.444-10.271-2.444c-10.494,0-17.544,6.414-17.544,12.404v101.147c0,7.163,7.214,12.166,17.544,12.166c3.934,0,7.449-0.752,10.299-2.069C261.906,325.954,259.17,322.372,259.17,317.968z"/>
      </svg>
      <h2 className='m-0 p-0'>
        An unexpected error has occurred. The application cache has been cleared.
      </h2>
      <button
        onClick={handleClick}
        className='flex items-center justify-center py-2.5 px-6 m-6 bg-primary text-white no-underline rounded uppercase cursor-pointer focus:outline-none border-none font-semibold'
      >
        Go to account settings
      </button>
    </div>
)
}

ErrorPage.propTypes = { statusCode: PropTypes.number }

ErrorPage.getInitialProps = ({ res, err }) => {//eslint-disable-next-line
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}
