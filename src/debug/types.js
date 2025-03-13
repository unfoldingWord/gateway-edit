/**
 * @typedef {'console' | 'user-action' | 'network' | 'error' | 'performance' | 'storage'} DebugEventType
 */

/**
 * @typedef {Object} DebugEvent
 * @property {number} timestamp
 * @property {DebugEventType} type
 * @property {any} data
 */

/**
 * @typedef {'click' | 'input' | 'keypress' | 'scroll' | 'focus' | 'blur' | 'copy' | 'paste' | 'contextmenu'} UserActionType
 */

/**
 * @typedef {Object} UserAction
 * @property {UserActionType} type
 * @property {string} target
 * @property {*} [value]
 * @property {{ x: number, y: number }} [position]
 * @property {number} timestamp
 */

/**
 * @typedef {Object} NetworkRequest
 * @property {string} url
 * @property {string} method
 * @property {Object.<string, string>} headers
 * @property {*} [body]
 * @property {*} [response]
 * @property {number} [status]
 * @property {number} duration
 * @property {'fetch' | 'xhr'} type
 */

/**
 * @typedef {Object} PerformanceMetric
 * @property {'navigation' | 'resource' | 'paint' | 'memory'} type
 * @property {*} value
 */

/**
 * @typedef {Object} StorageChange
 * @property {'localStorage' | 'sessionStorage' | 'cookie'} type
 * @property {'set' | 'remove' | 'clear'} action
 * @property {string} [key]
 * @property {*} [value]
 */

/**
 * @typedef {Object} DebugConfig
 * @property {number} maxEvents
 * @property {boolean} enableConsole
 * @property {boolean} enableNetwork
 * @property {boolean} enableUserActions
 * @property {boolean} enablePerformance
 * @property {boolean} enableStorage
 * @property {boolean} enableErrorTracking
 */
