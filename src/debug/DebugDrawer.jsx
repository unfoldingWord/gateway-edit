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
import SettingsIcon from '@material-ui/icons/Settings';
import CodeIcon from '@material-ui/icons/Code';
import NetworkCheckIcon from '@material-ui/icons/NetworkCheck';
import TouchAppIcon from '@material-ui/icons/TouchApp';
import SpeedIcon from '@material-ui/icons/Speed';
import StorageIcon from '@material-ui/icons/Storage';
import ErrorIcon from '@material-ui/icons/Error';
import Collapse from '@material-ui/core/Collapse';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import { DebugLogger } from './DebugLogger';

// Default filter settings
const DEFAULT_FILTERS = {
  console: true,
  network: true,
  userActions: true,
  performance: true,
  storage: true,
  errors: true
};

export default function DebugDrawer() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const debugLogger = DebugLogger.getInstance();

  // Initialize state from localStorage
  useEffect(() => {
    const debugEnabled = localStorage.getItem('debugModeEnabled') === 'true';
    setIsEnabled(debugEnabled);

    // Load saved filters
    try {
      const savedFilters = JSON.parse(localStorage.getItem('debugFilters'));
      if (savedFilters) {
        setFilters(savedFilters);
      }
    } catch (e) {
      console.error('Error loading debug filters:', e);
    }

    if (debugEnabled) {
      debugLogger.enable();
    }
  }, []);

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
      localStorage.setItem('debugModeEnabled', 'true');
    } else {
      debugLogger.disable();
      setIsEnabled(false);
      localStorage.setItem('debugModeEnabled', 'false');
    }
  };

  const handleFilterToggle = (filterName) => {
    const newFilters = { ...filters, [filterName]: !filters[filterName] };
    setFilters(newFilters);

    // Save to localStorage
    localStorage.setItem('debugFilters', JSON.stringify(newFilters));

    // Update logger config
    debugLogger.setConfig({
      enableConsole: newFilters.console,
      enableNetwork: newFilters.network,
      enableUserActions: newFilters.userActions,
      enablePerformance: newFilters.performance,
      enableStorage: newFilters.storage,
      enableErrorTracking: newFilters.errors
    });
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

  const toggleFiltersView = () => {
    setShowFilters(!showFilters);
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
          <ListItem button onClick={toggleFiltersView}>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Filter Settings" />
            {showFilters ? <ExpandLess /> : <ExpandMore />}
          </ListItem>

          <Collapse in={showFilters} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItem button onClick={() => handleFilterToggle('console')} style={{ paddingLeft: 32 }}>
                <ListItemIcon>
                  <CodeIcon />
                </ListItemIcon>
                <ListItemText primary="Console Logs" />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={filters.console}
                    onChange={() => handleFilterToggle('console')}
                  />
                </ListItemSecondaryAction>
              </ListItem>

              <ListItem button onClick={() => handleFilterToggle('network')} style={{ paddingLeft: 32 }}>
                <ListItemIcon>
                  <NetworkCheckIcon />
                </ListItemIcon>
                <ListItemText primary="Network Requests" />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={filters.network}
                    onChange={() => handleFilterToggle('network')}
                  />
                </ListItemSecondaryAction>
              </ListItem>

              <ListItem button onClick={() => handleFilterToggle('userActions')} style={{ paddingLeft: 32 }}>
                <ListItemIcon>
                  <TouchAppIcon />
                </ListItemIcon>
                <ListItemText primary="User Actions" />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={filters.userActions}
                    onChange={() => handleFilterToggle('userActions')}
                  />
                </ListItemSecondaryAction>
              </ListItem>

              <ListItem button onClick={() => handleFilterToggle('performance')} style={{ paddingLeft: 32 }}>
                <ListItemIcon>
                  <SpeedIcon />
                </ListItemIcon>
                <ListItemText primary="Performance" />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={filters.performance}
                    onChange={() => handleFilterToggle('performance')}
                  />
                </ListItemSecondaryAction>
              </ListItem>

              <ListItem button onClick={() => handleFilterToggle('storage')} style={{ paddingLeft: 32 }}>
                <ListItemIcon>
                  <StorageIcon />
                </ListItemIcon>
                <ListItemText primary="Storage" />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={filters.storage}
                    onChange={() => handleFilterToggle('storage')}
                  />
                </ListItemSecondaryAction>
              </ListItem>

              <ListItem button onClick={() => handleFilterToggle('errors')} style={{ paddingLeft: 32 }}>
                <ListItemIcon>
                  <ErrorIcon />
                </ListItemIcon>
                <ListItemText primary="Errors" />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={filters.errors}
                    onChange={() => handleFilterToggle('errors')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Collapse>

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
