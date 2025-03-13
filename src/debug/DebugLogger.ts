import { DebugEvent, UserAction, NetworkRequest, PerformanceMetric, StorageChange, DebugConfig } from './types';

export class DebugLogger {
  private static instance: DebugLogger;
  private events: DebugEvent[] = [];
  private isEnabled: boolean = false;
  private originalConsoleMethods: Record<string, Function> = {};
  private config: DebugConfig = {
    maxEvents: 1000,
    enableConsole: true,
    enableNetwork: true,
    enableUserActions: true,
    enablePerformance: true,
    enableStorage: true,
    enableErrorTracking: true
  };

  private constructor() {
    this.initializeTracking();
  }

  public static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  private initializeTracking(): void {
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

  public enable(): void {
    this.isEnabled = true;
  }

  public disable(): void {
    this.isEnabled = false;
  }

  public getEvents(): DebugEvent[] {
    return this.events;
  }

  public clearEvents(): void {
    this.events = [];
  }

  private logEvent(event: DebugEvent): void {
    if (this.isEnabled) {
      this.events.push(event);
      if (this.events.length > this.config.maxEvents) {
        this.events.shift();
      }
    }
  }

  private setupConsoleInterceptor(): void {
    const consoleMethods = ['log', 'warn', 'error', 'info', 'debug'];

    consoleMethods.forEach(method => {
      this.originalConsoleMethods[method] = console[method];
      console[method] = (...args: any[]) => {
        this.logEvent({
          timestamp: Date.now(),
          type: 'console',
          data: {
            method,
            arguments: args
          }
        });
        this.originalConsoleMethods[method].apply(console, args);
      };
    });
  }

  private setupFetchInterceptor(): void {
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const startTime = Date.now();

      try {
        const response = await originalFetch(input, init);
        const clone = response.clone();
        const responseBody = await clone.json();

        const request: NetworkRequest = {
          url: typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url,
          method: init?.method || 'GET',
          headers: init?.headers as Record<string, string> || {},
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

  private setupXHRInterceptor(): void {
    const XHR = XMLHttpRequest.prototype;
    const open = XHR.open;
    const send = XHR.send;

    XHR.open = function(method: string, url: string) {
      (this as any)._debugData = { method, url, startTime: Date.now() };
      return open.apply(this, arguments);
    };

    XHR.send = function(body: any) {
      const xhr = this;
      const debugData = (xhr as any)._debugData;

      xhr.addEventListener('load', function() {
        const request: NetworkRequest = {
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

  private setupUserActionListeners(): void {
    document.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const action: UserAction = {
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
    });

    document.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLInputElement;
      const action: UserAction = {
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
    });
  }

  private setupAdditionalUserActionListeners(): void {
    let scrollTimeout: NodeJS.Timeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const action: UserAction = {
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
      }, 150);
    });

    document.addEventListener('copy', (e) => {
      const action: UserAction = {
        type: 'copy',
        target: this.getElementPath(e.target as HTMLElement),
        value: window.getSelection()?.toString(),
        timestamp: Date.now()
      };
      this.logEvent({
        timestamp: Date.now(),
        type: 'user-action',
        data: action
      });
    });

    document.addEventListener('paste', (e) => {
      const action: UserAction = {
        type: 'paste',
        target: this.getElementPath(e.target as HTMLElement),
        value: (e as ClipboardEvent).clipboardData?.getData('text'),
        timestamp: Date.now()
      };
      this.logEvent({
        timestamp: Date.now(),
        type: 'user-action',
        data: action
      });
    });
  }

  private setupPerformanceMonitoring(): void {
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

    if ((performance as any).memory) {
      setInterval(() => {
        this.logEvent({
          timestamp: Date.now(),
          type: 'performance',
          data: {
            type: 'memory',
            value: (performance as any).memory
          }
        });
      }, 5000);
    }
  }

  private setupStorageMonitoring(): void {
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = (key: string, value: string) => {
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
    sessionStorage.setItem = (key: string, value: string) => {
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

  private setupErrorTracking(): void {
    window.addEventListener('error', (event) => {
      this.logEvent({
        timestamp: Date.now(),
        type: 'error',
        data: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error?.stack
        }
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.logEvent({
        timestamp: Date.now(),
        type: 'error',
        data: {
          type: 'unhandledRejection',
          reason: event.reason
        }
      });
    });
  }

  private getElementPath(element: HTMLElement): string {
    const path: string[] = [];
    let currentElement: HTMLElement | null = element;

    while (currentElement) {
      let selector = currentElement.tagName.toLowerCase();
      if (currentElement.id) {
        selector += `#${currentElement.id}`;
      } else if (currentElement.className) {
        selector += `.${currentElement.className.split(' ').join('.')}`;
      }
      path.unshift(selector);
      currentElement = currentElement.parentElement;
    }

    return path.join(' > ');
  }

  public exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.convertToCSV();
    }
    return JSON.stringify(this.events, null, 2);
  }

  private convertToCSV(): string {
    const headers = ['timestamp', 'type', 'data'];
    const rows = this.events.map(event => [
      event.timestamp,
      event.type,
      JSON.stringify(event.data)
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  public setConfig(config: Partial<DebugConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public filterEvents(options: {
    type?: string[],
    startTime?: number,
    endTime?: number
  }): DebugEvent[] {
    return this.events.filter(event => {
      if (options.type && !options.type.includes(event.type)) return false;
      if (options.startTime && event.timestamp < options.startTime) return false;
      if (options.endTime && event.timestamp > options.endTime) return false;
      return true;
    });
  }
}
