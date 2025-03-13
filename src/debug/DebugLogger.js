/**
 * @typedef {import('./types').DebugEvent} DebugEvent
 * @typedef {import('./types').UserAction} UserAction
 * @typedef {import('./types').NetworkRequest} NetworkRequest
 * @typedef {import('./types').PerformanceMetric} PerformanceMetric
 * @typedef {import('./types').StorageChange} StorageChange
 * @typedef {import('./types').DebugConfig} DebugConfig
 */

export class DebugLogger {
  /** @type {DebugLogger} */
  static instance;
  /** @type {DebugEvent[]} */
  events = [];
  /** @type {boolean} */
  isEnabled = false;
  /** @type {Object.<string, Function>} */
  originalConsoleMethods = {};
  /** @type {DebugConfig} */
  config = {
    maxEvents: 1000,
    enableConsole: true,
    enableNetwork: true,
    enableUserActions: true,
    enablePerformance: true,
    enableStorage: true,
    enableErrorTracking: true
  };
  /** @type {Function[]} */
  cleanupListeners = [];
  /** @type {boolean} */
  isLogging = false;

  constructor() {
    this.initializeTracking();
  }

  /**
   * @returns {DebugLogger}
   */
  static getInstance() {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  initializeTracking() {
    if (this.config.enableConsole) this.setupConsoleInterceptor();
    if (this.config.enableNetwork) {
      this.setupFetchInterceptor();
      this.setupXHRInterceptor();
    }
    if (this.config.enableUserActions) {
      this.setupUserActionListeners();
      this.setupAdditionalUserActionListeners();
    }
    if (this.config.enablePerformance) this.setupPerformanceMonitoring();
    if (this.config.enableStorage) this.setupStorageMonitoring();
    if (this.config.enableErrorTracking) this.setupErrorTracking();
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  /**
   * @returns {DebugEvent[]}
   */
  getEvents() {
    return this.events;
  }

  clearEvents() {
    this.events = [];
  }

  /**
   * Normalizes event data to a standard format
   * @param {string} eventType - The type of event (console, network, user-action, etc.)
   * @param {any} data - The raw event data
   * @returns {{ type: string, target: string, content: any, timestamp: number }} Normalized event data
   */
  normalizeEventData(eventType, data) {
    const timestamp = data.timestamp || Date.now();
    let normalized;

    switch (eventType) {
      case 'console':
        normalized = {
          type: data.method || 'log',
          target: 'console',
          content: {
            args: data.arguments,
            level: data.method
          }
        };
        break;

      case 'network':
        const url = data.url ? new URL(data.url) : null;
        normalized = {
          type: data.type || 'request', // 'fetch' or 'xhr'
          target: url ? url.pathname : 'unknown',
          content: {
            method: data.method,
            url: data.url,
            status: data.status,
            duration: data.duration,
            headers: data.headers,
            requestBody: data.body,
            response: data.response,
            error: data.error
          }
        };
        break;

      case 'user-action':
        normalized = {
          type: data.type || 'interaction',
          target: data.target || 'unknown',
          content: {
            action: data.type,
            element: data.target,
            value: data.value,
            position: data.position
          }
        };
        break;

      case 'error':
        normalized = {
          type: data.type || 'error',
          target: data.filename || 'app',
          content: {
            message: data.message,
            stack: data.error,
            line: data.lineno,
            column: data.colno,
            filename: data.filename
          }
        };
        break;

      case 'performance':
        normalized = {
          type: data.type || 'metric',
          target: data.name || 'unknown',
          content: {
            value: data.value,
            duration: data.duration,
            details: data.details
          }
        };
        break;

      case 'storage':
        normalized = {
          type: data.type || 'storage',
          target: data.key || 'unknown',
          content: {
            action: data.action,
            key: data.key,
            value: data.value,
            oldValue: data.oldValue,
            newValue: data.newValue
          }
        };
        break;

      default:
        normalized = {
          type: 'unknown',
          target: 'app',
          content: data
        };
    }

    return {
      ...normalized,
      timestamp
    };
  }

  /**
   * @param {DebugEvent} event
   */
  logEvent(event) {
    if (!this.isEnabled) return;

    // Skip logging internal debug messages
    if (event.type === 'console' &&
        Array.isArray(event.data?.arguments) &&
        event.data.arguments[0] === '[DebugLogger]') {
      return;
    }

    const normalizedData = this.normalizeEventData(event.type, {
      ...event.data,
      timestamp: event.timestamp
    });

    this.events.push({
      type: event.type,
      data: normalizedData
    });

    if (this.events.length > this.config.maxEvents) {
      this.events.shift();
    }
  }

  setupConsoleInterceptor() {
    const consoleMethods = ['log', 'warn', 'error', 'info', 'debug'];

    consoleMethods.forEach(method => {
      this.originalConsoleMethods[method] = console[method];
      console[method] = (...args) => {
        // Prevent recursion
        if (this.isLogging) {
          return;
        }

        this.isLogging = true;
        try {
          this.originalConsoleMethods[method].apply(console, args);

          // Only log if not an internal message
          if (args[0] !== '[DebugLogger]') {
            const errorData = method === 'error' ? this._processErrorArgs(args) : null;

            this.logEvent({
              timestamp: Date.now(),
              type: 'console',
              data: {
                method,
                arguments: args,
                ...(errorData && {
                  message: errorData.message,
                  stack: errorData.stack,
                  line: errorData.line,
                  column: errorData.column,
                  filename: errorData.filename
                })
              }
            });
          }
        } finally {
          this.isLogging = false;
        }
      };
    });
  }

  /**
   * Process error arguments to extract useful information
   * @private
   * @param {any[]} args
   * @returns {{ message: string, stack?: string, line?: number, column?: number, filename?: string }}
   */
  _processErrorArgs(args) {
    let errorInfo = {
      message: '',
      stack: undefined,
      line: undefined,
      column: undefined,
      filename: undefined
    };

    // Process each argument
    args.forEach(arg => {
      if (arg instanceof Error) {
        // Handle Error objects
        errorInfo.message = arg.message;
        errorInfo.stack = arg.stack;

        // Try to parse line/column/filename from stack trace
        const stackMatch = arg.stack?.match(/at .+:(\d+):(\d+)/);
        if (stackMatch) {
          errorInfo.line = parseInt(stackMatch[1], 10);
          errorInfo.column = parseInt(stackMatch[2], 10);
        }

        // Try to get filename from stack
        const fileMatch = arg.stack?.match(/\((.+?):\d+:\d+\)/);
        if (fileMatch) {
          errorInfo.filename = fileMatch[1];
        }
      } else if (typeof arg === 'string') {
        // Handle string messages
        errorInfo.message = errorInfo.message
          ? `${errorInfo.message} ${arg}`
          : arg;
      } else {
        // Handle other types
        try {
          const stringified = JSON.stringify(arg);
          errorInfo.message = errorInfo.message
            ? `${errorInfo.message} ${stringified}`
            : stringified;
        } catch (e) {
          errorInfo.message = errorInfo.message
            ? `${errorInfo.message} [Unstringifiable Object]`
            : '[Unstringifiable Object]';
        }
      }
    });

    return errorInfo;
  }

  setupFetchInterceptor() {
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const startTime = Date.now();

      try {
        const response = await originalFetch(input, init);
        const clone = response.clone();
        const responseBody = await clone.json();

        /** @type {NetworkRequest} */
        const request = {
          url: typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url,
          method: init?.method || 'GET',
          headers: init?.headers || {},
          body: init?.body,
          response: responseBody,
          status: response.status,
          duration: Date.now() - startTime,
          type: 'fetch'
        };

        this.logEvent({
          timestamp: Date.now(),
          type: 'network',
          data: request
        });

        return response;
      } catch (error) {
        this.logEvent({
          timestamp: Date.now(),
          type: 'network',
          data: {
            url: typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url,
            method: init?.method || 'GET',
            headers: init?.headers || {},
            body: init?.body,
            error: error.message,
            duration: Date.now() - startTime,
            type: 'fetch'
          }
        });
        throw error;
      }
    };
  }

  setupXHRInterceptor() {
    const XHR = XMLHttpRequest.prototype;
    const open = XHR.open;
    const send = XHR.send;

    XHR.open = function(method, url) {
      this._debugData = { method, url, startTime: Date.now() };
      return open.apply(this, arguments);
    };

    XHR.send = function(body) {
      const xhr = this;
      const debugData = xhr._debugData;

      xhr.addEventListener('load', function() {
        /** @type {NetworkRequest} */
        const request = {
          url: debugData.url,
          method: debugData.method,
          headers: {},
          body: body,
          response: xhr.responseText,
          status: xhr.status,
          duration: Date.now() - debugData.startTime,
          type: 'xhr'
        };

        DebugLogger.getInstance().logEvent({
          timestamp: Date.now(),
          type: 'network',
          data: request
        });
      });

      return send.apply(this, arguments);
    };
  }

  /**
   * Internal method for logging warnings without causing recursion
   * @private
   * @param {string} message
   */
  _logInternalWarning(message) {
    if (this.originalConsoleMethods.warn) {
      this.isLogging = true;
      try {
        this.originalConsoleMethods.warn.call(console, '[DebugLogger]', message);
      } finally {
        this.isLogging = false;
      }
    }
  }

  /**
   * Checks if an element should be tracked based on configured ignore patterns
   * @param {HTMLElement} element
   * @returns {boolean}
   */
  shouldTrackElement(element) {
    if (!element) return false;

    // Always ignore debug panel elements
    if (element.hasAttribute('data-debug-panel')) return false;

    // Check against configured ignore patterns
    const ignorePatterns = this.config.userActionConfig?.ignoreElements || [];
    for (const pattern of ignorePatterns) {
      try {
        if (element.matches(pattern) || element.closest(pattern)) {
          return false;
        }
      } catch (e) {
        this._logInternalWarning(`Invalid selector pattern in debug config: ${pattern}`);
      }
    }

    return true;
  }

  setupUserActionListeners() {
    const clickHandler = (e) => {
      const target = /** @type {HTMLElement} */ (e.target);
      if (!this.shouldTrackElement(target)) return;

      /** @type {UserAction} */
      const action = {
        type: 'click',
        target: this.getElementPath(target),
        position: { x: e.clientX, y: e.clientY },
        timestamp: Date.now()
      };

      this.logEvent({
        timestamp: Date.now(),
        type: 'user-action',
        data: action
      });
    };

    const inputHandler = (e) => {
      const target = /** @type {HTMLInputElement} */ (e.target);
      if (!this.shouldTrackElement(target)) return;

      /** @type {UserAction} */
      const action = {
        type: 'input',
        target: this.getElementPath(target),
        value: target.value,
        timestamp: Date.now()
      };

      this.logEvent({
        timestamp: Date.now(),
        type: 'user-action',
        data: action
      });
    };

    document.addEventListener('click', clickHandler);
    document.addEventListener('input', inputHandler);

    this.cleanupListeners.push(() => {
      document.removeEventListener('click', clickHandler);
      document.removeEventListener('input', inputHandler);
    });
  }

  setupAdditionalUserActionListeners() {
    // Only set up scroll listener if tracking is enabled
    if (this.config.userActionConfig?.trackScroll !== false) {
      /** @type {NodeJS.Timeout} */
      let scrollTimeout;
      const scrollHandler = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          /** @type {UserAction} */
          const action = {
            type: 'scroll',
            target: 'window',
            position: {
              x: window.scrollX,
              y: window.scrollY
            },
            timestamp: Date.now()
          };
          this.logEvent({
            timestamp: Date.now(),
            type: 'user-action',
            data: action
          });
        }, 100);
      };

      window.addEventListener('scroll', scrollHandler);
      this.cleanupListeners.push(() => {
        window.removeEventListener('scroll', scrollHandler);
      });
    }

    const focusHandler = (e) => {
      const target = /** @type {HTMLElement} */ (e.target);
      if (!this.shouldTrackElement(target)) return;

      /** @type {UserAction} */
      const action = {
        type: 'focus',
        target: this.getElementPath(target),
        timestamp: Date.now()
      };

      this.logEvent({
        timestamp: Date.now(),
        type: 'user-action',
        data: action
      });
    };

    const blurHandler = (e) => {
      const target = /** @type {HTMLElement} */ (e.target);
      if (!this.shouldTrackElement(target)) return;

      /** @type {UserAction} */
      const action = {
        type: 'blur',
        target: this.getElementPath(target),
        timestamp: Date.now()
      };

      this.logEvent({
        timestamp: Date.now(),
        type: 'user-action',
        data: action
      });
    };

    document.addEventListener('focus', focusHandler, true);
    document.addEventListener('blur', blurHandler, true);

    this.cleanupListeners.push(() => {
      document.removeEventListener('focus', focusHandler, true);
      document.removeEventListener('blur', blurHandler, true);
    });
  }

  setupPerformanceMonitoring() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        this.logEvent({
          timestamp: Date.now(),
          type: 'performance',
          data: {
            type: 'navigation',
            value: navigation
          }
        });
      }, 0);
    });

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        this.logEvent({
          timestamp: Date.now(),
          type: 'performance',
          data: {
            type: 'resource',
            value: entry
          }
        });
      });
    });
    observer.observe({ entryTypes: ['resource'] });

    if (performance.memory) {
      setInterval(() => {
        this.logEvent({
          timestamp: Date.now(),
          type: 'performance',
          data: {
            type: 'memory',
            value: performance.memory
          }
        });
      }, 5000);
    }
  }

  setupStorageMonitoring() {
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = (key, value) => {
      this.logEvent({
        timestamp: Date.now(),
        type: 'storage',
        data: {
          type: 'localStorage',
          action: 'set',
          key,
          value
        }
      });
      originalSetItem.call(localStorage, key, value);
    };

    const originalSessionSetItem = sessionStorage.setItem;
    sessionStorage.setItem = (key, value) => {
      this.logEvent({
        timestamp: Date.now(),
        type: 'storage',
        data: {
          type: 'sessionStorage',
          action: 'set',
          key,
          value
        }
      });
      originalSessionSetItem.call(sessionStorage, key, value);
    };
  }

  /**
   * Captures and parses a stack trace
   * @private
   * @returns {{ stack: string, parsedStack: Array<{functionName: string, fileName: string, lineNumber: number, columnNumber: number}> }}
   */
  _captureStackTrace() {
    const stackTrace = new Error().stack;
    const stackLines = stackTrace.split('\n').slice(1); // Remove the Error: line

    const parsedStack = stackLines.map(line => {
      // Parse stack trace line. Example formats:
      // Chrome: "    at functionName (filename:lineNumber:columnNumber)"
      // Firefox: "functionName@filename:lineNumber:columnNumber"
      const chromeMatch = line.match(/^\s*at\s+([^(]+)\s*\(([^:]+):(\d+):(\d+)\)/);
      const firefoxMatch = line.match(/^([^@]+)@([^:]+):(\d+):(\d+)/);
      const match = chromeMatch || firefoxMatch;

      if (match) {
        return {
          functionName: match[1].trim(),
          fileName: match[2],
          lineNumber: parseInt(match[3], 10),
          columnNumber: parseInt(match[4], 10)
        };
      }

      // Fallback for other formats
      return {
        functionName: 'unknown',
        fileName: line.trim(),
        lineNumber: 0,
        columnNumber: 0
      };
    });

    return {
      stack: stackTrace,
      parsedStack
    };
  }

  setupErrorTracking() {
    window.addEventListener('error', (event) => {
      const stackInfo = this._captureStackTrace();

      this.logEvent({
        timestamp: Date.now(),
        type: 'error',
        data: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error?.stack,
          stack: stackInfo.stack,
          parsedStack: stackInfo.parsedStack,
          // Additional context
          type: event.type,
          isTrusted: event.isTrusted,
          timeStamp: event.timeStamp,
          // Browser and environment info
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          // Page context
          url: window.location.href,
          referrer: document.referrer,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        }
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      const stackInfo = this._captureStackTrace();

      this.logEvent({
        timestamp: Date.now(),
        type: 'error',
        data: {
          type: 'unhandledRejection',
          reason: event.reason,
          stack: stackInfo.stack,
          parsedStack: stackInfo.parsedStack,
          // Additional context
          timeStamp: event.timeStamp,
          // Browser and environment info
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          // Page context
          url: window.location.href,
          referrer: document.referrer,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        }
      });
    });

    // Add console.error interceptor to track errors logged via console
    const originalError = console.error;
    console.error = (...args) => {
      const stackInfo = this._captureStackTrace();

      this.logEvent({
        timestamp: Date.now(),
        type: 'error',
        data: {
          type: 'console.error',
          arguments: args,
          stack: stackInfo.stack,
          parsedStack: stackInfo.parsedStack,
          // Browser and environment info
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          // Page context
          url: window.location.href
        }
      });

      originalError.apply(console, args);
    };
  }

  /**
   * @param {HTMLElement} element
   * @returns {string}
   */
  getElementPath(element) {
    /** @type {string[]} */
    const path = [];
    let currentElement = element;

    while (currentElement) {
      let selector = currentElement.tagName.toLowerCase();
      if (currentElement.id) {
        selector += `#${currentElement.id}`;
      } else if (currentElement.className) {
        // Handle both string and SVGAnimatedString cases
        const classes = typeof currentElement.className === 'string'
          ? currentElement.className
          : currentElement.className.baseVal || '';  // SVG case

        if (classes) {
          selector += `.${classes.split(' ').join('.')}`;
        }
      }
      path.unshift(selector);
      currentElement = currentElement.parentElement;
    }

    return path.join(' > ');
  }

  /**
   * @param {'json' | 'csv'} [format='json']
   * @returns {string}
   */
  exportLogs(format = 'json') {
    if (format === 'csv') {
      return this.convertToCSV();
    }
    return JSON.stringify(this.events, null, 2);
  }

  /**
   * Escapes and quotes a CSV field to handle special characters
   * @private
   * @param {any} field
   * @returns {string}
   */
  _escapeCsvField(field) {
    if (field === null || field === undefined) {
      return '';
    }

    let stringField = typeof field === 'object' ?
      JSON.stringify(field).replace(/"/g, '""') :
      String(field).replace(/"/g, '""');

    // Quote the field if it contains commas, quotes, newlines, or carriage returns
    if (/[,"\n\r]/.test(stringField)) {
      stringField = `"${stringField}"`;
    }

    return stringField;
  }

  /**
   * @returns {string}
   */
  convertToCSV() {
    const headers = ['timestamp', 'type', 'data'];
    const rows = this.events.map(event => [
      event.timestamp,
      event.type,
      this._escapeCsvField(event.data)
    ]);

    return [
      headers.map(h => this._escapeCsvField(h)).join(','),
      ...rows.map(row => row.map(field => this._escapeCsvField(field)).join(','))
    ].join('\n');
  }

  /**
   * @param {Partial<DebugConfig>} config
   */
  setConfig(config) {
    const oldConfig = this.config;
    this.config = { ...this.config, ...config };

    // Clean up existing listeners
    this.cleanupListeners.forEach(cleanup => cleanup());
    this.cleanupListeners = [];

    // Reinitialize tracking with new config
    this.initializeTracking();
  }

  /**
   * @param {Object} options
   * @param {string[]} [options.type]
   * @param {number} [options.startTime]
   * @param {number} [options.endTime]
   * @returns {DebugEvent[]}
   */
  filterEvents(options) {
    return this.events.filter(event => {
      if (options.type && !options.type.includes(event.type)) return false;
      if (options.startTime && event.timestamp < options.startTime) return false;
      if (options.endTime && event.timestamp > options.endTime) return false;
      return true;
    });
  }

  /**
   * Analyzes the most recent error or a specific error event
   * @param {DebugEvent} [errorEvent] Optional specific error event to analyze
   * @returns {Promise<string>} Analysis of the error and its context
   */
  async analyzeError(errorEvent = null) {
    const analyzer = new (await import('./DebugAnalyzer.js')).DebugAnalyzer();

    if (errorEvent) {
      return analyzer.analyzeError(errorEvent, this.events);
    }

    return analyzer.analyzeLatestError(this);
  }
}
