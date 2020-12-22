import { withStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'

const GreenButton = withStyles(theme => ({
  root: {
    color: '#fff',
    backgroundColor: '#1BCC25',
    '&:hover': {
      backgroundColor: '#07b811',
    },
    border: '1px solid #0089C7',
    marginLeft: '12px',
  },
}))(Button)

export default GreenButton
