import React, { useState, useEffect } from 'react';
import { DebugLogger } from './DebugLogger';

// Default filter settings
const DEFAULT_FILTERS = {
  console: true,
  network: true,
  userActions: true,
  performance: true,
  storage: false,
  errors: true
};

// Helper to check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * DebugProvider component that initializes and manages the debug logger
 * This component should be mounted at the application root level to ensure
 * debug tracking is always active when debug mode is enabled
 */
export default function DebugProvider({ children }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Only initialize the debugLogger in browser environments
  const debugLogger = isBrowser ? DebugLogger.getInstance() : null;

  // Check if debug mode was previously enabled in localStorage
  useEffect(() => {
    if (!isBrowser) return;

    const debugEnabled = localStorage.getItem('debugModeEnabled') === 'true';

    // Load saved filters from localStorage or use defaults
    let savedFilters;
    try {
      savedFilters = JSON.parse(localStorage.getItem('debugFilters')) || DEFAULT_FILTERS;
    } catch (e) {
      savedFilters = DEFAULT_FILTERS;
    }

    setFilters(savedFilters);

    if (debugEnabled) {
      debugLogger.enable();
      debugLogger.setConfig({
        enableConsole: savedFilters.console,
        enableNetwork: savedFilters.network,
        enableUserActions: savedFilters.userActions,
        enablePerformance: savedFilters.performance,
        enableStorage: savedFilters.storage,
        enableErrorTracking: savedFilters.errors
      });
      setIsEnabled(true);
    }
  }, []);

  // Set up a listener for debug mode changes
  useEffect(() => {
    if (!isBrowser) return;

    const handleDebugModeChange = (event) => {
      if (event.key === 'debugModeEnabled') {
        const enabled = event.newValue === 'true';
        setIsEnabled(enabled);
        if (enabled) {
          debugLogger.enable();
        } else {
          debugLogger.disable();
        }
      } else if (event.key === 'debugFilters') {
        try {
          const newFilters = JSON.parse(event.newValue) || DEFAULT_FILTERS;
          setFilters(newFilters);

          // Update logger config with new filters
          debugLogger.setConfig({
            enableConsole: newFilters.console,
            enableNetwork: newFilters.network,
            enableUserActions: newFilters.userActions,
            enablePerformance: newFilters.performance,
            enableStorage: newFilters.storage,
            enableErrorTracking: newFilters.errors
          });
        } catch (e) {
          console.error('Error parsing debug filters:', e);
        }
      }
    };

    window.addEventListener('storage', handleDebugModeChange);
    return () => {
      window.removeEventListener('storage', handleDebugModeChange);
    };
  }, []);

  // This component doesn't render anything visible
  // It just ensures the debug logger is initialized and running
  return children;
}
