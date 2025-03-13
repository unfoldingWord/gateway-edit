import React, { useState, useEffect } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Switch from '@material-ui/core/Switch';
import BugReportIcon from '@material-ui/icons/BugReport';
import DownloadIcon from '@material-ui/icons/GetApp';
import DeleteIcon from '@material-ui/icons/Delete';
import { DebugLogger } from './DebugLogger';

export default function DebugDrawer() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const debugLogger = DebugLogger.getInstance();

  useEffect(() => {
    // Update event count every second when enabled
    let interval;
    if (isEnabled) {
      interval = setInterval(() => {
        setEventCount(debugLogger.getEvents().length);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isEnabled]);

  const handleToggle = () => {
    if (!isEnabled) {
      debugLogger.enable();
      setIsEnabled(true);
    } else {
      debugLogger.disable();
      setIsEnabled(false);
    }
  };

  const handleExport = () => {
    const logs = debugLogger.exportLogs();
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    debugLogger.clearEvents();
    setEventCount(0);
  };

  return (
    <List disablePadding>
      <ListItem>
        <ListItemIcon>
          <BugReportIcon />
        </ListItemIcon>
        <ListItemText
          primary="Debug Mode"
          secondary={isEnabled ? `${eventCount} events captured` : 'Disabled'}
        />
        <ListItemSecondaryAction>
          <Switch
            edge="end"
            checked={isEnabled}
            onChange={handleToggle}
            inputProps={{ 'aria-label': 'Toggle debug mode' }}
          />
        </ListItemSecondaryAction>
      </ListItem>
      {isEnabled && (
        <>
          <ListItem button onClick={handleExport} disabled={eventCount === 0}>
            <ListItemIcon>
              <DownloadIcon />
            </ListItemIcon>
            <ListItemText primary="Export Debug Logs" />
          </ListItem>
          <ListItem button onClick={handleClear} disabled={eventCount === 0}>
            <ListItemIcon>
              <DeleteIcon />
            </ListItemIcon>
            <ListItemText primary="Clear Debug Logs" />
          </ListItem>
        </>
      )}
    </List>
  );
}
