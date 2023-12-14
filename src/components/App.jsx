import { ThemeProvider } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'
import StoreContextProvider from '@context/StoreContext'
import AuthContextProvider from '@context/AuthContext'
import '@styles/globals.css'
import WorkspaceContainer from '@components/WorkspaceContainer'
import Layout from '@components/Layout'
import theme from '../theme'

// TODO: set page title again

export default function Application() {
  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
      <CssBaseline />
      <AuthContextProvider>
        <StoreContextProvider>
          <Layout>
            <WorkspaceContainer />
          </Layout>
        </StoreContextProvider>
      </AuthContextProvider>
    </ThemeProvider>
  )
}

Application.propTypes = { }
