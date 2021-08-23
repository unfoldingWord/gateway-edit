import PropTypes from 'prop-types'

const ScreenDimmer = ({ dimmedScreen }) => (
  <div
    id="dimmer"
    style={{
      backgroundColor: '#000000',
      display: dimmedScreen ? 'block' : 'none',
      position: 'fixed',
      opacity: '0.6',
      width: '100%',
      height: '100%',
      top: '0',
      zIndex: '1500',
      userSelect: 'none',
    }}>
  </div>
)

ScreenDimmer.propTypes = {
  dimmedScreen: PropTypes.bool.isRequired,
}

export default ScreenDimmer
