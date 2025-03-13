import { useEffect, useCallback } from 'react';
import { DebugLogger } from './DebugLogger';

/**
 * @typedef {import('./types').DebugConfig} DebugConfig
 * @typedef {import('./types').DebugEvent} DebugEvent
 */

/**
 * @param {Partial<DebugConfig>} [initialConfig]
 */
export const useDebugger = (initialConfig) => {
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

  /**
   * @param {{
   *   type?: string[],
   *   startTime?: number,
   *   endTime?: number
   * }} options
   * @returns {DebugEvent[]}
   */
  const filterEvents = useCallback((options) => {
    return DebugLogger.getInstance().filterEvents(options);
  }, []);

  /**
   * @param {'json' | 'csv'} [format='json']
   * @returns {string}
   */
  const exportLogs = useCallback((format = 'json') => {
    return DebugLogger.getInstance().exportLogs(format);
  }, []);

  return {
    getEvents,
    clearEvents,
    filterEvents,
    exportLogs
  };
};
