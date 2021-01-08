import React from 'react'
import { useRouter } from 'next/router'
import { makeStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import IconButton from '@material-ui/core/IconButton'
import Button from '@material-ui/core/Button'
import SubmitButton from '@components/SubmitButton'
import ShareIcon from '@material-ui/icons/Share'
import Toolbar from '@material-ui/core/Toolbar'
import MenuIcon from '@material-ui/icons/Menu'
import LinkIcon from '@material-ui/icons/Link'
import AppBar from '@material-ui/core/AppBar'
import Drawer from '@components/Drawer'
import BibleReference from '@components/BibleReference'

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
  },
  button: {
    minWidth: '40px',
    padding: '5px 0px',
    marginRight: theme.spacing(3),
  },
  icon: {
    width: '40px',
  },
  menuButton: {
    marginRight: theme.spacing(1),
  },
  title: {
    flexGrow: 1,
    cursor: 'pointer',
  },
  navigation: {
    flexGrow: 1,
  },
}))

export default function Header({ appName }) {
  const classes = useStyles()
  const router = useRouter()
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
      <AppBar position='static' classes={{ root: 'py-1.5' }}>
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
          <Typography
            variant='h6'
            className={classes.title}
            onClick={() => router.push('/')}
          >
            {appName}
          </Typography>
          <div className={classes.navigation}>
            <BibleReference />
          </div>
          <Button
            className={classes.button}
            variant='outlined'
            onClick={() => {}}
          >
            <LinkIcon classes={{ root: classes.icon }} htmlColor='#ffffff' />
          </Button>
          <Button
            className={classes.button}
            variant='outlined'
            onClick={() => {}}
          >
            <ShareIcon classes={{ root: classes.icon }} htmlColor='#ffffff' />
          </Button>
          <SubmitButton variant='contained' disableElevation active={false} />
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
