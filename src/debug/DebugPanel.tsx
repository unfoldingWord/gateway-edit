import React, { useState, useEffect } from 'react';
import { useDebugger } from './useDebugger';
import { DebugEvent } from './types';

export const DebugPanel: React.FC = () => {
  const { getEvents, clearEvents, filterEvents, exportLogs } = useDebugger({
    maxEvents: 1000,
    enableConsole: true,
    enableNetwork: true,
    enableUserActions: true,
    enablePerformance: true,
    enableStorage: true,
    enableErrorTracking: true
  });

  const [events, setEvents] = useState<DebugEvent[]>([]);
  const [filter, setFilter] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const filteredEvents = filter.length > 0
        ? filterEvents({ type: filter })
        : getEvents();
      setEvents(filteredEvents);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [filter, getEvents, filterEvents]);

  const handleExport = (format: 'json' | 'csv') => {
    const data = exportLogs(format);
    const blob = new Blob([data], { type: 'text/plain' });
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
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-md shadow-lg"
      >
        Show Debug Panel
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl p-4 max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Debug Panel</h2>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => handleExport('json')}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Export JSON
        </button>
        <button
          onClick={() => handleExport('csv')}
          className="bg-green-500 text-white px-3 py-1 rounded"
        >
          Export CSV
        </button>
        <button
          onClick={clearEvents}
          className="bg-red-500 text-white px-3 py-1 rounded"
        >
          Clear
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {['console', 'user-action', 'network', 'error', 'performance', 'storage'].map((type) => (
          <label key={type} className="inline-flex items-center">
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
              className="mr-1"
            />
            {type}
          </label>
        ))}
      </div>

      <div className="space-y-2">
        {events.map((event, index) => (
          <div
            key={index}
            className="p-2 bg-gray-50 rounded text-sm"
          >
            <div className="flex justify-between text-xs text-gray-500">
              <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
              <span className="font-medium">{event.type}</span>
            </div>
            <pre className="mt-1 whitespace-pre-wrap">
              {JSON.stringify(event.data, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};
