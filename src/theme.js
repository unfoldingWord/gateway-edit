import { createTheme } from '@material-ui/core/styles'
import { red, pink } from '@material-ui/core/colors'

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: '#38ADDF',
      contrastText: '#fff',
    },
    secondary: {
      main: pink.A200,
      contrastText: '#000',
    },
    error: { main: red.A400 },
    background: { default: '#fff' },
    green: '#1BCC25',
  },
})

export default theme
