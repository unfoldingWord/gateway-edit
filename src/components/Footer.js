import NetlifyBadge from '@components/NetlifyBadge'
import Typography from '@material-ui/core/Typography'
import PropTypes from 'prop-types'

export default function Footer({
  buildVersion,
  buildHash,
}) {
  return (
    <footer className='flex justify-center items-center h-20 w-screen bg-primary border border-solid border-gray-200'>
      <Typography
        variant='h6'
      >
        <div style={{ color: 'white', width: 'max-content', paddingLeft: '20px' }}>
          <span id='build_version'>{`v${buildVersion} `}</span>
          <span id='build_hash' style={{ fontSize: '0.6em' }}>{`build ${buildHash}`}</span>
        </div>
      </Typography>
      <NetlifyBadge />
    </footer>
  )
}

Footer.propTypes = {
  buildVersion: PropTypes.string,
  buildHash: PropTypes.string,
}
