import React, { useState, useEffect } from 'react';
import { useDebugger } from './useDebugger';
import ReactJson from 'react-json-view';

/**
 * @typedef {import('./types').DebugEvent} DebugEvent
 */

/**
 * @typedef {'asc' | 'desc'} SortDirection
 */

/**
 * @typedef {Object} DebugPanelProps
 * @property {Object} [config] - Configuration options for the debug panel
 * @property {number} [config.maxEvents=1000] - Maximum number of events to store
 * @property {boolean} [config.enableConsole=true] - Enable console logging
 * @property {boolean} [config.enableNetwork=true] - Enable network request logging
 * @property {Object} [config.userActions] - User action logging configuration
 * @property {boolean} [config.userActions.enabled=true] - Enable user action logging
 * @property {boolean} [config.userActions.trackScroll=true] - Track scroll events
 * @property {boolean} [config.userActions.trackClick=true] - Track click events
 * @property {boolean} [config.userActions.trackInput=true] - Track input events
 * @property {boolean} [config.userActions.trackFocus=true] - Track focus events
 * @property {string[]} [config.userActions.ignoreElements=[]] - Selectors for elements to ignore
 * @property {boolean} [config.enablePerformance=true] - Enable performance logging
 * @property {boolean} [config.enableStorage=true] - Enable storage logging
 * @property {boolean} [config.enableErrorTracking=true] - Enable error tracking
 * @property {string[]} [config.initialFilters=[]] - Initial event type filters
 */

/**
 * Sanitizes sensitive data from event data
 * @param {any} data - The event data to sanitize
 * @param {string} eventType - The type of event
 * @returns {any} Sanitized data
 */
const sanitizeEventData = (data, eventType) => {
  if (eventType !== 'network') return data;

  const sanitized = { ...data };

  // Sanitize headers
  if (sanitized.headers) {
    const sanitizedHeaders = { ...sanitized.headers };
    const sensitiveHeaders = [
      'authorization',
      'x-api-key',
      'api-key',
      'token',
      'x-auth-token',
      'jwt',
      'bearer',
      'cookie',
      'set-cookie'
    ];

    sensitiveHeaders.forEach(header => {
      if (sanitizedHeaders[header]) sanitizedHeaders[header] = '[REDACTED]';
      if (sanitizedHeaders[header.toLowerCase()]) sanitizedHeaders[header.toLowerCase()] = '[REDACTED]';
      if (sanitizedHeaders[header.toUpperCase()]) sanitizedHeaders[header.toUpperCase()] = '[REDACTED]';
    });

    sanitized.headers = sanitizedHeaders;
  }

  // Sanitize request body if it might contain auth data
  if (sanitized.body && typeof sanitized.body === 'object') {
    const sensitiveFields = [
      'password',
      'token',
      'apiKey',
      'api_key',
      'secret',
      'authorization',
      'auth',
      'credentials'
    ];

    const sanitizedBody = { ...sanitized.body };
    sensitiveFields.forEach(field => {
      if (field in sanitizedBody) sanitizedBody[field] = '[REDACTED]';
    });

    sanitized.body = sanitizedBody;
  }

  // Sanitize URL parameters
  if (sanitized.url) {
    try {
      const url = new URL(sanitized.url);
      const sensitiveParams = ['token', 'api_key', 'key', 'secret', 'auth'];
      sensitiveParams.forEach(param => {
        if (url.searchParams.has(param)) {
          url.searchParams.set(param, '[REDACTED]');
        }
      });
      sanitized.url = url.toString();
    } catch (e) {
      // If URL parsing fails, keep original URL
    }
  }

  return sanitized;
};

/**
 * Gets the event type and target information
 * @param {any} data - The event data
 * @param {string} eventType - The type of event
 * @returns {{ type: string, target: string, details: string }} Event information
 */
const getEventInfo = (data, eventType) => {
  try {
    const { type, target, content } = data;

    switch (eventType) {
      case 'console':
        return {
          type: type,
          target: target,
          details: Array.isArray(content.args)
            ? content.args.map(arg => String(arg)).join(' ')
            : String(content.args)
        };

      case 'network':
        return {
          type: `${content.method || 'GET'} ${type}`,
          target: target,
          details: content.error
            ? `Error: ${content.error}`
            : `${content.status || ''} ${content.duration ? `(${content.duration}ms)` : ''}`
        };

      case 'user-action':
        return {
          type: type,
          target: target,
          details: getActionDetails(content)
        };

      case 'error':
        return {
          type: type,
          target: target,
          details: content.message || String(content)
        };

      case 'performance':
        return {
          type: type,
          target: target,
          details: content.duration ? `${content.duration}ms` : JSON.stringify(content.value)
        };

      case 'storage':
        return {
          type: type,
          target: target,
          details: content.oldValue !== undefined
            ? `${content.oldValue} → ${content.newValue}`
            : content.value
        };

      default:
        return {
          type: type || 'unknown',
          target: target || 'app',
          details: JSON.stringify(content).slice(0, 100) + (JSON.stringify(content).length > 100 ? '...' : '')
        };
    }
  } catch (e) {
    return {
      type: 'unknown',
      target: 'app',
      details: 'Unable to parse event data'
    };
  }
};

/**
 * Gets formatted details for user actions
 * @param {{ action: string, element: string, value: any, position: { x: number, y: number } }} content
 * @returns {string}
 */
const getActionDetails = (content) => {
  switch (content.action) {
    case 'click':
      return `clicked at (${content.position?.x || 0}, ${content.position?.y || 0})`;
    case 'input':
      return `value: "${content.value || ''}"`;
    case 'focus':
      return 'focused';
    case 'blur':
      return 'blurred';
    case 'scroll':
      return `scrolled to (${content.position?.x || 0}, ${content.position?.y || 0})`;
    default:
      return content.value ? `value: "${content.value}"` : '';
  }
};

/**
 * Creates a simple preview of the event data
 * @param {any} data - The event data to preview
 * @param {string} eventType - The type of event
 * @returns {string} A simple preview string
 */
const createEventPreview = (data, eventType) => {
  const info = getEventInfo(data, eventType);
  return `${info.type} | ${info.target}${info.details ? ` | ${info.details}` : ''}`;
};

/**
 * @param {DebugPanelProps} props
 * @returns {JSX.Element}
 */
export const DebugPanel = ({
  config = {}
}) => {
  const {
    maxEvents = 1000,
    enableConsole = true,
    enableNetwork = true,
    userActions = {
      enabled: true,
      trackScroll: true,
      trackClick: true,
      trackInput: true,
      trackFocus: true,
      ignoreElements: []
    },
    enablePerformance = true,
    enableStorage = true,
    enableErrorTracking = true,
    initialFilters = []
  } = config;

  const { getEvents, clearEvents, filterEvents, exportLogs } = useDebugger({
    maxEvents,
    enableConsole,
    enableNetwork,
    enableUserActions: userActions.enabled,
    userActionConfig: {
      trackScroll: userActions.trackScroll,
      trackClick: userActions.trackClick,
      trackInput: userActions.trackInput,
      trackFocus: userActions.trackFocus,
      ignoreElements: [
        '[data-debug-panel]',  // Ignore the debug panel itself
        '.no-track',           // Ignore elements with no-track class
        '*[class*="no-track"]', // Ignore elements with no-track in their class
        ...(userActions.ignoreElements || [])
      ]
    },
    enablePerformance,
    enableStorage,
    enableErrorTracking
  });

  /** @type {[DebugEvent[], React.Dispatch<React.SetStateAction<DebugEvent[]>>]} */
  const [events, setEvents] = useState([]);
  /** @type {[string[], React.Dispatch<React.SetStateAction<string[]>>]} */
  const [filter, setFilter] = useState(initialFilters);
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [isExpanded, setIsExpanded] = useState(false);
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [isFullscreen, setIsFullscreen] = useState(false);
  /** @type {[SortDirection, React.Dispatch<React.SetStateAction<SortDirection>>]} */
  const [sortDirection, setSortDirection] = useState(/** @type {SortDirection} */ ('desc'));

  /** @type {[Set<number>, React.Dispatch<React.SetStateAction<Set<number>>>]} */
  const [expandedEvents, setExpandedEvents] = useState(new Set());

  const toggleEventExpansion = (index) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  useEffect(() => {
    const interval = window.setInterval(() => {
      const filteredEvents = filter.length > 0
        ? filterEvents({ type: filter })
        : getEvents();

      // Sort events based on timestamp
      const sortedEvents = [...filteredEvents].sort((a, b) => {
        const timestampA = a.data.timestamp;
        const timestampB = b.data.timestamp;
        const diff = timestampA - timestampB;
        return sortDirection === 'asc' ? diff : -diff;
      });

      setEvents(sortedEvents);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [filter, getEvents, filterEvents, sortDirection]);

  /**
   * @param {'json' | 'csv'} format
   */
  const handleExport = (format) => {
    const data = exportLogs(format);
    // Sanitize the exported data
    const sanitizedData = format === 'json'
      ? JSON.stringify(JSON.parse(data).map(event => ({
          ...event,
          data: sanitizeEventData(event.data, event.type)
        })))
      : data; // For CSV, keep original as it's usually already formatted

    const blob = new Blob([sanitizedData], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs.${format}`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="no-track fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-md shadow-lg z-50 no-track"
        data-debug-panel
      >
        Show Debug Panel
      </button>
    );
  }

  const panelClasses = isFullscreen
    ? 'fixed inset-0 w-full h-full bg-white flex flex-col z-50 no-track'
    : 'fixed bottom-4 right-4 w-110 bg-white rounded-lg shadow-xl overflow-hidden flex flex-col z-50 no-track'

  const panelStyle = isFullscreen
    ? {}
    : { maxHeight: 'calc(100vh - 32px)' };

  // Only show event types that are enabled in the config
  const availableEventTypes = [
    enableConsole && 'console',
    userActions.enabled && 'user-action',
    enableNetwork && 'network',
    enableErrorTracking && 'error',
    enablePerformance && 'performance',
    enableStorage && 'storage'
  ].filter(Boolean);

  return (
    <div className={panelClasses} style={panelStyle} data-debug-panel>
      <div className="no-track flex-none flex justify-between items-center p-2 border-b bg-white sticky top-0">
        <h2 className="no-track text-sm font-semibold">Debug Panel</h2>
        <div className="no-track flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="no-track text-gray-500 hover:text-gray-700 text-sm px-2"
          >
            {isFullscreen ? '⊽' : '⊻'}
          </button>
          <button
            onClick={() => setIsExpanded(false)}
            className="no-track text-gray-500 hover:text-gray-700 text-sm px-2"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="no-track flex-none p-2 border-b bg-gray-50 flex flex-wrap gap-1 sticky top-[40px]">
        <div className="no-track flex items-center gap-2 w-full">
          <div className="no-track flex gap-1">
            <button
              onClick={() => handleExport('json')}
              className="no-track bg-blue-500 text-white px-2 py-0.5 rounded text-xs"
            >
              Export JSON
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="no-track bg-green-500 text-white px-2 py-0.5 rounded text-xs"
            >
              Export CSV
            </button>
            <button
              onClick={clearEvents}
              className="no-track bg-red-500 text-white px-2 py-0.5 rounded text-xs"
            >
              Clear
            </button>
          </div>
          <div className="no-track flex items-center gap-1 ml-auto">
            <span className="no-track text-xs text-gray-600">Sort:</span>
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="no-track bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-0.5 rounded text-xs flex items-center gap-1"
            >
              {sortDirection === 'asc' ? '↑' : '↓'} Date
            </button>
          </div>
        </div>
      </div>

      <div className="no-track flex-none p-2 border-b bg-gray-50 flex flex-wrap gap-1 sticky top-[84px]">
        {availableEventTypes.map((type) => (
          <label key={type} className="no-track inline-flex items-center text-xs">
            <input
              type="checkbox"
              checked={filter.includes(type)}
              onChange={(e) => {
                if (e.target.checked) {
                  setFilter([...filter, type]);
                } else {
                  setFilter(filter.filter(t => t !== type));
                }
              }}
              className="no-track mr-1 h-3 w-3"
            />
            {type}
          </label>
        ))}
      </div>

      <div className="no-track flex-1 overflow-y-auto min-h-0 space-y-1">
        {events.map((event, index) => {
          const isExpanded = expandedEvents.has(index);
          const sanitizedData = sanitizeEventData(event.data, event.type);
          const eventInfo = getEventInfo(sanitizedData, event.type);

          return (
            <div
              key={index}
              className="no-track border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
              onClick={() => toggleEventExpansion(index)}
            >
              <div className="no-track flex justify-between items-center px-2 py-1 bg-gray-100">
                <div className="no-track flex items-center gap-2 min-w-0 flex-1">
                  <span className="no-track text-xs text-gray-600 shrink-0">
                    {new Date(event.data.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="no-track text-xs font-medium text-gray-700 shrink-0">
                    {event.type}
                  </span>
                  <span className="no-track text-xs text-gray-600 truncate">
                    {eventInfo.type} | {eventInfo.target}
                  </span>
                </div>
                <span className="no-track text-xs text-gray-400 pl-2">
                  {isExpanded ? '▼' : '▶'}
                </span>
              </div>
              <div className="no-track text-xs">
                {isExpanded ? (
                  <div className="no-track p-2">
                    <ReactJson
                      src={sanitizedData}
                      name={null}
                      theme="rjv-default"
                      collapsed={2}
                      displayDataTypes={false}
                      enableClipboard={false}
                      style={{ padding: '8px' }}
                    />
                  </div>
                ) : (
                  <div className="no-track px-2 py-1 font-mono text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis">
                    {eventInfo.details}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
