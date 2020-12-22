import { createMuiTheme } from '@material-ui/core/styles'
import { red } from '@material-ui/core/colors'

// Create a theme instance.
const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#00B0FF',
      contrastText: '#fff',
    },
    secondary: {
      main: '#19857b',
      contrastText: '#000',
    },
    error: {
      main: red.A400,
    },
    background: {
      default: '#fff',
    },
    green: '#1BCC25',
  },
})

export default theme
