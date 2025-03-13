import { useEffect, useCallback } from 'react';
import { DebugLogger } from './DebugLogger';
import { DebugConfig, DebugEvent } from './types';

export const useDebugger = (initialConfig?: Partial<DebugConfig>) => {
  useEffect(() => {
    const logger = DebugLogger.getInstance();
    if (initialConfig) {
      logger.setConfig(initialConfig);
    }
    logger.enable();

    return () => {
      logger.disable();
    };
  }, []);

  const getEvents = useCallback(() => {
    return DebugLogger.getInstance().getEvents();
  }, []);

  const clearEvents = useCallback(() => {
    DebugLogger.getInstance().clearEvents();
  }, []);

  const filterEvents = useCallback((options: {
    type?: string[],
    startTime?: number,
    endTime?: number
  }) => {
    return DebugLogger.getInstance().filterEvents(options);
  }, []);

  const exportLogs = useCallback((format: 'json' | 'csv' = 'json') => {
    return DebugLogger.getInstance().exportLogs(format);
  }, []);

  return {
    getEvents,
    clearEvents,
    filterEvents,
    exportLogs
  };
};
