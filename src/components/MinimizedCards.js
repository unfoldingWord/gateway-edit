import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import Fab from '@material-ui/core/Fab'
import Badge from '@material-ui/core/Badge'
import CropLandscapeIcon from '@material-ui/icons/CropLandscape'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import CloseIcon from '@material-ui/icons/Close'

const useStyles = makeStyles((theme) => ({
  items: {
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    bottom: '85px',
    right: '0%',
    margin: '0px 15px',
    marginLeft: '-50px',
    zIndex: 2,
    cursor: 'pointer',
    textAlign: 'center',
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    margin: '5px 0px',
  },
  card: { width: '100%' },
  itemFab: {
    marginLeft: '5px',
    minWidth: '56px',
    minHeight: '56px',
  },
  fab: {
    position: 'fixed',
    bottom: '15px',
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

export default function MinimizedCards({ minimizedCards = [], maximizeCard }) {
  const [showFabList, setShowFabList] = useState(false)
  const classes = useStyles()
  const badgeContent = minimizedCards.length

  const toggleDrawer = (open) => {
    setShowFabList(open)
  }

  const onMaximizeCard = (id) => {
    toggleDrawer(false)
    maximizeCard(id)
  }

  if (badgeContent && badgeContent > 0) {
    return (
      <div>
        {showFabList &&
          <div className={classes.items}>
            {minimizedCards.length > 0 && minimizedCards.map(({ title, id }, index) => {
              const titleMessage = `Restore ${title} card.`

              return (
                <div key={`${index}_${title}_fab`} className={classes.item} onClick={() => onMaximizeCard(id)}>
                  <Card className={classes.card} title={titleMessage}>
                    <CardContent>
                      <b>{title}</b>
                    </CardContent>
                  </Card>
                  <Fab
                    color="primary"
                    variant="circular"
                    title={titleMessage}
                    aria-label={titleMessage}
                    className={classes.itemFab}
                  >
                    <CropLandscapeIcon/>
                  </Fab>
                </div>
              )
            })}
          </div>
        }
        <Fab
          color='inherit'
          className={classes.fab}
          aria-label='minimized cards'
          onClick={() => toggleDrawer(!showFabList)}
          variant={showFabList ? 'circular' : 'extended'}
        >
          {showFabList ?
            <CloseIcon title='Close'/>
            :
            <Badge badgeContent={badgeContent} max={999} color='secondary'>
              <CropLandscapeIcon className={classes.icon} />
              Recent cards&nbsp;&nbsp;
            </Badge>
          }
        </Fab>
      </div>
    )
  } else {
    return <div/>
  }
}

MinimizedCards.propTypes = {
  minimizedCards: PropTypes.array,
  maximizeCard: PropTypes.func,
}
