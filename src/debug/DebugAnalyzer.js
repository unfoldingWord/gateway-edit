/**
 * @typedef {import('./types').DebugEvent} DebugEvent
 *
 * @typedef {Object} OllamaConfig
 * @property {string} endpoint - The Ollama API endpoint
 * @property {string} model - The model to use (e.g., 'mistral', 'llama2', etc.)
 * @property {number} [timeout] - Request timeout in milliseconds
 * @property {boolean} [stream] - Whether to stream the response
 */

export class DebugAnalyzer {
  /** @type {OllamaConfig} */
  config;
  /** @type {boolean} */
  isLocalEnvironment;

  /**
   * @param {Partial<OllamaConfig>} [config]
   */
  constructor(config = {}) {
    // Check if we're in a local development environment
    this.isLocalEnvironment = window.location.hostname === 'localhost' ||
                             window.location.hostname === '127.0.0.1';

    if (!this.isLocalEnvironment) {
      console.warn('[DebugLogger] Ollama analysis is only available in local development environment');
    }

    this.config = {
      endpoint: config.endpoint || 'http://localhost:11434/api/generate',
      model: config.model || 'mistral',
      timeout: config.timeout || 30000,
      stream: config.stream || false
    };
  }

  /**
   * Checks if Ollama is available and properly configured
   * @returns {Promise<boolean>}
   */
  async checkOllamaAvailability() {
    if (!this.isLocalEnvironment) {
      return false;
    }

    try {
      const response = await fetch(this.config.endpoint.replace('/generate', '/version'), {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout for health check
      });

      if (!response.ok) {
        throw new Error(`Ollama server responded with status: ${response.status}`);
      }

      const data = await response.json();
      console.info('[DebugLogger] Ollama version:', data.version);
      return true;
    } catch (error) {
      console.warn('[DebugLogger] Ollama is not available:', error.message);
      return false;
    }
  }

  /**
   * Provides setup instructions for Ollama
   * @returns {string}
   */
  static getSetupInstructions() {
    return `
# Local Development Setup for Debug Analyzer

## Prerequisites
- Ensure you're running the application locally (localhost)
- Windows users need WSL2 installed

## Setup Steps

1. Install Ollama:
   - Windows (WSL2):
     1. Open WSL2 terminal
     2. Run: \`curl https://ollama.ai/install.sh | sh\`
   - MacOS:
     \`curl https://ollama.ai/install.sh | sh\`
   - Linux:
     \`curl https://ollama.ai/install.sh | sh\`

2. Start Ollama Server:
   \`\`\`bash
   # Windows (WSL2): Open WSL terminal and run:
   ollama serve

   # MacOS/Linux:
   ollama serve
   \`\`\`

3. Pull the Mistral model:
   \`\`\`bash
   ollama pull mistral
   \`\`\`

4. Test the setup:
   Open a new terminal and run:
   \`\`\`bash
   curl http://localhost:11434/api/generate -d '{
     "model": "mistral",
     "prompt": "Hello, how are you?"
   }'
   \`\`\`

## Troubleshooting

1. Windows Users:
   - Ensure WSL2 is installed and running
   - Run Ollama server from WSL2 terminal
   - Your application must be accessed via localhost

2. Common Issues:
   - Port 11434 must be available
   - Firewall might block connections
   - WSL2 network bridge must be properly configured

For more details: https://github.com/ollama/ollama

Note: This analyzer only works in local development environment.
`;
  }

  /**
   * Formats a stack trace for human readability
   * @private
   * @param {Array<{functionName: string, fileName: string, lineNumber: number, columnNumber: number}>} parsedStack
   * @returns {string}
   */
  _formatStackTrace(parsedStack) {
    return parsedStack.map((frame, index) => {
      return `${index + 1}. ${frame.functionName} (${frame.fileName}:${frame.lineNumber}:${frame.columnNumber})`;
    }).join('\n');
  }

  /**
   * Analyzes an error event and its context to create a narrative
   * @param {DebugEvent} errorEvent - The error event to analyze
   * @param {DebugEvent[]} contextEvents - Previous events leading to the error
   * @returns {Promise<string>} A narrative analysis of the error and its context
   */
  async analyzeError(errorEvent, contextEvents) {
    // Filter relevant events within a 5-minute window before the error
    const timeWindow = 5 * 60 * 1000; // 5 minutes in milliseconds
    const relevantEvents = contextEvents.filter(event =>
      event.data.timestamp >= errorEvent.data.timestamp - timeWindow &&
      event.data.timestamp < errorEvent.data.timestamp
    );

    // Create a chronological narrative of events
    const narrative = this._createEventNarrative(relevantEvents);

    // Format the stack trace if available
    const stackTrace = errorEvent.data.content.parsedStack ?
      this._formatStackTrace(errorEvent.data.content.parsedStack) :
      errorEvent.data.content.stack || 'No stack trace available';

    // Prepare the prompt for Ollama
    const prompt = `As a debugging assistant, analyze this error and its context:

Error Details:
Type: ${errorEvent.data.content.type || 'Error'}
Message: ${errorEvent.data.content.message || errorEvent.data.content.reason || 'Unknown error'}
Location: ${errorEvent.data.content.filename || 'Unknown'}:${errorEvent.data.content.lineno || 0}

Stack Trace:
${stackTrace}

Browser Context:
- User Agent: ${errorEvent.data.content.userAgent || 'Unknown'}
- Platform: ${errorEvent.data.content.platform || 'Unknown'}
- URL: ${errorEvent.data.content.url || 'Unknown'}
- Viewport: ${JSON.stringify(errorEvent.data.content.viewport || {})}

Events Leading to Error (last 5 minutes):
${narrative}

Please provide:
1. A clear explanation of what the user was doing when the error occurred
2. Analysis of the stack trace and error location
3. Potential causes of the error based on the event sequence and stack trace
4. Recommended steps to investigate or fix the issue
5. Suggestions for preventing similar errors in the future

Format your response in markdown.`;

    // Get analysis from Ollama
    const analysis = await this._queryOllama(prompt);
    return analysis;
  }

  /**
   * Creates a chronological narrative of events
   * @private
   * @param {DebugEvent[]} events
   * @returns {string}
   */
  _createEventNarrative(events) {
    return events.map(event => {
      const timestamp = new Date(event.data.timestamp).toISOString();

      switch (event.type) {
        case 'user-action':
          return `[${timestamp}] User ${event.data.content.action} on ${event.data.content.element}` +
            (event.data.content.value ? ` with value: ${event.data.content.value}` : '') +
            (event.data.content.position ? ` at position (${event.data.content.position.x}, ${event.data.content.position.y})` : '');

        case 'network':
          return `[${timestamp}] ${event.data.content.method} request to ${event.data.content.url}` +
            (event.data.content.status ? ` (Status: ${event.data.content.status})` : '') +
            (event.data.content.duration ? ` - took ${event.data.content.duration}ms` : '');

        case 'console':
          return `[${timestamp}] Console ${event.data.content.level}: ${event.data.content.args.join(' ')}`;

        case 'performance':
          const perfValue = typeof event.data.content.value === 'object' ?
            JSON.stringify(event.data.content.value) :
            event.data.content.value;
          return `[${timestamp}] Performance ${event.data.type}: ${perfValue}`;

        case 'storage':
          return `[${timestamp}] Storage ${event.data.content.action}: ${event.data.content.key}=${event.data.content.value}`;

        default:
          return `[${timestamp}] ${event.type}: ${JSON.stringify(event.data.content)}`;
      }
    }).join('\n');
  }

  /**
   * Queries Ollama for analysis with proper error handling and timeouts
   * @private
   * @param {string} prompt
   * @returns {Promise<string>}
   */
  async _queryOllama(prompt) {
    if (!this.isLocalEnvironment) {
      return 'Error: Ollama analysis is only available in local development environment. ' +
             'Please run the application on localhost to use this feature.';
    }

    try {
      // Check Ollama availability first
      const isAvailable = await this.checkOllamaAvailability();
      if (!isAvailable) {
        return `Error: Ollama is not available. ${DebugAnalyzer.getSetupInstructions()}`;
      }

      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          prompt: prompt,
          stream: this.config.stream
        }),
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      if (error.name === 'TimeoutError') {
        return `Error: Ollama request timed out after ${this.config.timeout}ms. Please try again or check the Ollama server.`;
      }

      // Provide specific guidance for common errors
      let errorMessage = `Error analyzing debug information: ${error.message}.`;
      if (error.message.includes('Failed to fetch')) {
        errorMessage += '\n\nPossible causes:\n' +
          '1. Ollama server is not running\n' +
          '2. Wrong WSL configuration (Windows users)\n' +
          '3. Firewall blocking connection\n' +
          '4. Port 11434 is not available';
      }

      console.error('[DebugLogger] Error querying Ollama:', error);
      return `${errorMessage}\n\n${DebugAnalyzer.getSetupInstructions()}`;
    }
  }

  /**
   * Gets the most recent error event and its context
   * @param {import('./DebugLogger').DebugLogger} debugLogger
   * @returns {Promise<string>}
   */
  async analyzeLatestError(debugLogger) {
    const events = debugLogger.getEvents();
    const lastErrorEvent = [...events].reverse().find(event => event.type === 'error');

    if (!lastErrorEvent) {
      return 'No errors found in the debug log.';
    }

    return this.analyzeError(lastErrorEvent, events);
  }
}
