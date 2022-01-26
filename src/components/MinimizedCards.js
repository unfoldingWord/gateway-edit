import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import Fab from '@material-ui/core/Fab'
import IconButton from '@material-ui/core/IconButton'
import NavigationIcon from '@material-ui/icons/Navigation'
import MaximizeIcon from '@material-ui/icons/Maximize'
import ListIcon from '@material-ui/icons/List'
import MinimizeIcon from '@material-ui/icons/Minimize'
import Badge from '@material-ui/core/Badge'
import Drawer from '@material-ui/core/Drawer'
import List from '@material-ui/core/List'
import Divider from '@material-ui/core/Divider'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import InboxIcon from '@material-ui/icons/MoveToInbox'
import MailIcon from '@material-ui/icons/Mail'
import DashboardOutlinedIcon from '@material-ui/icons/DashboardOutlined'

const useStyles = makeStyles((theme) => ({
  fab: {
    position: 'fixed',
    bottom: '85px',
    right: '0%',
    margin: '0px 15px',
    marginLeft: '-50px',
    zIndex: 2,
    cursor: 'pointer',
    textAlign: 'center',
  },
  icon: { marginRight: theme.spacing(1) },
  list: { width: 250 },
  fullList: { width: 'auto' },
}))

export default function MinimizedCards({ minimizedCards = [{ title: 'translationWords List' }, { title: 'translationNotes' }], maximizeCard }) {
  const [showDrawer, setShowDrawer] = useState(false)
  const classes = useStyles()
  const badgeContent = minimizedCards.length

  const toggleDrawer = (open) => {
    console.log('toggleDrawer')

    setShowDrawer(open)
  }

  const onMaximizeCard = (id, title) => {
    console.log({ id, title })
    toggleDrawer(false)
    maximizeCard(id)
  }

  console.log({ showDrawer })

  return (
    <div>
      <Fab
        // variant="extended"
        // size="small"
        color="primary"
        className={classes.fab}
        aria-label="minimized cards"
        onClick={() => toggleDrawer(true)}
      >
        <Badge badgeContent={badgeContent} max={999} color='secondary' showZero>
          <MinimizeIcon className={classes.icon} />
        </Badge>
      </Fab>
      <Drawer anchor='bottom' open={showDrawer} onClose={() => toggleDrawer(false)}>
        <List>
          <ListItem key='Recent minimized cards'>
            <ListItemIcon>
              <MinimizeIcon />
            </ListItemIcon>
            <ListItemText primary='Recent minimized cards' />
          </ListItem>
        </List>
        <Divider />
        <List>
          {minimizedCards.map(({ title, id }, index) => (
            <ListItem button key={title} onClick={() => onMaximizeCard(id, title)}>
              <ListItemIcon>
                <DashboardOutlinedIcon/>
              </ListItemIcon>
              <ListItemText primary={title} />
            </ListItem>
          ))}
        </List>
      </Drawer>
    </div>
  )
}

MinimizedCards.propTypes = {
  minimizedCards: PropTypes.array,
  maximizeCard: PropTypes.func,
}
