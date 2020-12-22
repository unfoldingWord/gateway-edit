import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import IconButton from '@material-ui/core/IconButton'
import GreenButton from '@components/GreenButton'
import ShareIcon from '@material-ui/icons/Share'
import Toolbar from '@material-ui/core/Toolbar'
import MenuIcon from '@material-ui/icons/Menu'
import LinkIcon from '@material-ui/icons/Link'
import AppBar from '@material-ui/core/AppBar'
import Drawer from '@components/Drawer'

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(1),
  },
  title: {
    flexGrow: 1,
  },
}))

export default function Header({ appName }) {
  const classes = useStyles()
  const [drawerOpen, setOpen] = React.useState(false)
  // TODO: Remove test data
  const user = {
    name: 'John Doe',
    // avatar_url:
    // 'https://pbs.twimg.com/profile_images/885868801232961537/b1F6H4KC_400x400.jpg',
  }

  const handleDrawerOpen = () => {
    setOpen(true)
  }

  const handleDrawerClose = () => {
    setOpen(false)
  }

  return (
    <header>
      <AppBar position='static'>
        <Toolbar>
          <IconButton
            edge='start'
            className={classes.menuButton}
            color='inherit'
            aria-label='menu'
            onClick={handleDrawerOpen}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant='h6' className={classes.title}>
            {appName}
          </Typography>
          <IconButton className={classes.menuButton} onClick={() => {}}>
            <LinkIcon htmlColor='#ffffff' />
          </IconButton>
          <IconButton className={classes.menuButton} onClick={() => {}}>
            <ShareIcon htmlColor='#ffffff' />
          </IconButton>
          <GreenButton variant='contained' disableElevation>
            Submit
          </GreenButton>
        </Toolbar>
      </AppBar>
      <Drawer
        user={user}
        open={drawerOpen}
        onOpen={handleDrawerOpen}
        onClose={handleDrawerClose}
      />
    </header>
  )
}
