import React, { useState, useEffect } from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { DebugLogger } from './DebugLogger';

const useStyles = makeStyles((theme) => ({
  dialogTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
  tableContainer: {
    maxHeight: 400,
  },
  jsonView: {
    backgroundColor: '#f5f5f5',
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1),
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    overflowX: 'auto',
    maxHeight: 400,
    overflowY: 'auto',
  },
  timestamp: {
    whiteSpace: 'nowrap',
  },
  typeCell: {
    whiteSpace: 'nowrap',
  },
  contentCell: {
    maxWidth: 300,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  tabPanel: {
    padding: theme.spacing(2),
  },
}));

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  const classes = useStyles();

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`debug-tabpanel-${index}`}
      aria-labelledby={`debug-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box className={classes.tabPanel}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function DebugLogViewer({ open, onClose, displayFilter = 'all' }) {
  const classes = useStyles();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const debugLogger = DebugLogger.getInstance();

  useEffect(() => {
    if (open) {
      // Get all events when the dialog opens
      const allEvents = debugLogger.getEvents();

      // Filter events if a display filter is set
      const filteredEvents = displayFilter === 'all'
        ? allEvents
        : allEvents.filter(event => event.type === displayFilter);

      setEvents(filteredEvents);
    }
  }, [open, displayFilter]);

  const handleRowClick = (event) => {
    setSelectedEvent(event);
    setTabValue(0);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString() + '.' + date.getMilliseconds().toString().padStart(3, '0');
  };

  const formatEventType = (event) => {
    if (!event || !event.data) return 'Unknown';

    const { type, target } = event.data;
    return `${type} (${target})`;
  };

  const formatEventContent = (event) => {
    if (!event || !event.data || !event.data.content) return '';

    const { content } = event.data;

    if (typeof content === 'string') return content;

    try {
      // Try to create a simple preview based on event type
      switch (event.type) {
        case 'console':
          return Array.isArray(content.args)
            ? content.args.map(arg => String(arg)).join(' ')
            : String(content.args);

        case 'network':
          return `${content.method || 'GET'} ${content.url || ''} ${content.status || ''}`;

        case 'user-action':
          return `${content.action || ''} ${content.element || ''}`;

        case 'error':
          return content.message || String(content);

        default:
          return JSON.stringify(content).slice(0, 100) +
            (JSON.stringify(content).length > 100 ? '...' : '');
      }
    } catch (e) {
      return 'Error formatting content';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      aria-labelledby="debug-log-viewer-title"
    >
      <DialogTitle id="debug-log-viewer-title" disableTypography className={classes.dialogTitle}>
        <Typography variant="h6">Debug Logs</Typography>
        <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <TableContainer component={Paper} className={classes.tableContainer}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Content</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((event, index) => (
                <TableRow
                  key={index}
                  hover
                  onClick={() => handleRowClick(event)}
                  selected={selectedEvent === event}
                >
                  <TableCell className={classes.timestamp}>
                    {formatTimestamp(event.data.timestamp)}
                  </TableCell>
                  <TableCell className={classes.typeCell}>
                    {formatEventType(event)}
                  </TableCell>
                  <TableCell className={classes.contentCell}>
                    {formatEventContent(event)}
                  </TableCell>
                </TableRow>
              ))}
              {events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    No debug events captured
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {selectedEvent && (
          <div style={{ marginTop: 16 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="debug event tabs">
              <Tab label="Formatted" id="debug-tab-0" aria-controls="debug-tabpanel-0" />
              <Tab label="Raw JSON" id="debug-tab-1" aria-controls="debug-tabpanel-1" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Typography variant="subtitle2">
                Type: {formatEventType(selectedEvent)}
              </Typography>
              <Typography variant="subtitle2">
                Time: {formatTimestamp(selectedEvent.data.timestamp)}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Details:
              </Typography>
              <div className={classes.jsonView}>
                {(() => {
                  try {
                    const { content } = selectedEvent.data;

                    // Format based on event type
                    switch (selectedEvent.type) {
                      case 'console':
                        return (
                          <div>
                            <div><strong>Level:</strong> {content.level}</div>
                            <div><strong>Arguments:</strong></div>
                            <div style={{ marginLeft: 16 }}>
                              {Array.isArray(content.args)
                                ? content.args.map((arg, i) => (
                                    <div key={i}>{JSON.stringify(arg, null, 2)}</div>
                                  ))
                                : JSON.stringify(content.args, null, 2)}
                            </div>
                          </div>
                        );

                      case 'network':
                        return (
                          <div>
                            <div><strong>Method:</strong> {content.method}</div>
                            <div><strong>URL:</strong> {content.url}</div>
                            <div><strong>Status:</strong> {content.status}</div>
                            <div><strong>Duration:</strong> {content.duration}ms</div>
                            {content.headers && (
                              <div>
                                <strong>Headers:</strong>
                                <div style={{ marginLeft: 16 }}>
                                  {JSON.stringify(content.headers, null, 2)}
                                </div>
                              </div>
                            )}
                            {content.requestBody && (
                              <div>
                                <strong>Request Body:</strong>
                                <div style={{ marginLeft: 16 }}>
                                  {JSON.stringify(content.requestBody, null, 2)}
                                </div>
                              </div>
                            )}
                            {content.response && (
                              <div>
                                <strong>Response:</strong>
                                <div style={{ marginLeft: 16 }}>
                                  {JSON.stringify(content.response, null, 2)}
                                </div>
                              </div>
                            )}
                            {content.error && (
                              <div>
                                <strong>Error:</strong> {content.error}
                              </div>
                            )}
                          </div>
                        );

                      case 'user-action':
                        return (
                          <div>
                            <div><strong>Action:</strong> {content.action}</div>
                            <div><strong>Element:</strong> {content.element}</div>
                            {content.value !== undefined && (
                              <div><strong>Value:</strong> {content.value}</div>
                            )}
                            {content.position && (
                              <div>
                                <strong>Position:</strong> ({content.position.x}, {content.position.y})
                              </div>
                            )}
                          </div>
                        );

                      case 'error':
                        return (
                          <div>
                            <div><strong>Message:</strong> {content.message}</div>
                            {content.filename && (
                              <div><strong>File:</strong> {content.filename}</div>
                            )}
                            {content.line && (
                              <div><strong>Line:</strong> {content.line}:{content.column}</div>
                            )}
                            {content.stack && (
                              <div>
                                <strong>Stack:</strong>
                                <pre style={{ marginTop: 8 }}>{content.stack}</pre>
                              </div>
                            )}
                          </div>
                        );

                      default:
                        return JSON.stringify(content, null, 2);
                    }
                  } catch (e) {
                    return `Error formatting event: ${e.message}`;
                  }
                })()}
              </div>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <div className={classes.jsonView}>
                {JSON.stringify(selectedEvent, null, 2)}
              </div>
            </TabPanel>
          </div>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
