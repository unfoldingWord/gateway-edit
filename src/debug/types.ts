export interface DebugEvent {
  timestamp: number;
  type: 'console' | 'user-action' | 'network' | 'error' | 'performance' | 'storage';
  data: any;
}

export interface UserAction {
  type: 'click' | 'input' | 'keypress' | 'scroll' | 'focus' | 'blur' | 'copy' | 'paste' | 'contextmenu';
  target: string;
  value?: any;
  position?: { x: number; y: number };
  timestamp: number;
}

export interface NetworkRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  response?: any;
  status?: number;
  duration: number;
  type: 'fetch' | 'xhr';
}

export interface PerformanceMetric {
  type: 'navigation' | 'resource' | 'paint' | 'memory';
  value: any;
}

export interface StorageChange {
  type: 'localStorage' | 'sessionStorage' | 'cookie';
  action: 'set' | 'remove' | 'clear';
  key?: string;
  value?: any;
}

export interface DebugConfig {
  maxEvents: number;
  enableConsole: boolean;
  enableNetwork: boolean;
  enableUserActions: boolean;
  enablePerformance: boolean;
  enableStorage: boolean;
  enableErrorTracking: boolean;
}
