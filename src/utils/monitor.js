const OverflowAmount = 1.25;
const MinuteInMilliseconds = 60 * 1000; // 60,000 ms = 1 minute
const TrackIntervalMinutes = 1;
const MaximumTimeoutMinutes = 10;

/**
 * The Monitor class is responsible for monitoring for two events:
 *  - wake up from sleep - the minute timer taking significantly long than minute (sign browser tab was sleeping)
 *  - watchdog time - too long between changing verse
 */
class Monitor {
  constructor() {
    this.minuteCounter = 0; // increments elapsed seconds from last monitor reset
    this.timeoutCallback = null; // callback for timeout
    this.minuteTimer = null;
    this.monitorStartTime = 0;
    this.maximumWaitTime = MaximumTimeoutMinutes;
  }

  /**
   * Starts a minute counter for tracking training duration
   *
   * Initializes a counter that increments every minute to track
   * training duration, even if the system clock jumps (e.g., during sleep).
   *
   * @param {Function} callback - Callback function to invoke when time overflow is detected
   * @param {number} _maximumWaitTime - Maximum wait time in minutes before triggering timeout
   * @returns {NodeJS.Timeout} Timer interval ID
   */
  start(callback, _maximumWaitTime=MaximumTimeoutMinutes) {
    console.log(`Monitor.start() - Timer started, _maximumWaitTime=${_maximumWaitTime}`);

    this.timeoutCallback = callback;
    this.maximumWaitTime = _maximumWaitTime;

    let startTime = Date.now(); // Capture start time
    this.monitorStartTime = startTime;

    this.minuteTimer = setInterval(() => {
      this.minuteCounter++;
      // console.log(`Monitor.start() - timer event ${this.minuteCounter} minute(s) elapsed`);
      let stopTime = Date.now();

      const actualTimerElapsedMin = this.getElapsedMinutes(startTime, stopTime); // time since last timer event
      const minSinceMonitorStart = this.getElapsedMinutes(this.monitorStartTime, stopTime);

      if (actualTimerElapsedMin > TrackIntervalMinutes * OverflowAmount) { // if discrepancy in timer delay, probably woke up from sleep
        console.log(`Monitor.start() - ${actualTimerElapsedMin} actually elapsed during ${TrackIntervalMinutes} time`);
        this.timeoutCallback?.(actualTimerElapsedMin, minSinceMonitorStart);
      } else if (minSinceMonitorStart > this.maximumWaitTime) {
        console.log(`Monitor.start() - ${minSinceMonitorStart} exceeded ${TrackIntervalMinutes} time`);
        this.timeoutCallback?.(actualTimerElapsedMin, minSinceMonitorStart);
      }

      startTime = Date.now();
    }, TrackIntervalMinutes * MinuteInMilliseconds);
  }

  /**
   * Checks if the minute tracker is initialized and running
   *
   * @returns {boolean} True if initialized and running, false otherwise
   */
  initialized() {
   return this.timeoutCallback && this.minuteTimer;
  }

  /**
   * Stops the minute tracker
   *
   * Cleans up the timer that tracks training duration.
   */
  stop() {
    this.timeoutCallback = null;
    console.log(`Monitor.stop() - stopped`);
    if (this.minuteTimer) {
      clearInterval(this.minuteTimer);
      this.minuteTimer = null;
    }
  }

  /**
   * Gets the current minute counter value
   *
   * @returns {number} Minutes elapsed during training
   */
  getMinuteCounter() {
    return this.minuteCounter;
  }

  /**
   * Gets the current minute counter value
   *
   * @returns {number} Minutes elapsed during training
   */
  getMaximumWaitTime() {
    return this.maximumWaitTime;
  }

  /**
   * Resets the minute counter to zero.
   *
   * @return {void} This method does not return a value.
   */
  reset() {
    this.minuteCounter = 0;
    this.monitorStartTime = Date.now();
    console.log(`Monitor.reset() - reset`);
  }

  /**
   * Calculates elapsed minutes between times
   *
   * @param {number} startTime - The time at start
   * @param {number} endTime - The time at end
   * @returns {number} Elapsed time in minutes
   */
  getElapsedMinutes(startTime, endTime) {
    const elapsed = endTime - startTime;
    return elapsed / (1000 * 60);
  }
}

// Export a singleton instance for backward compatibility
const minuteTrackerInstance = new Monitor();

/**
 * Gets the singleton Monitor instance
 *
 * Returns the shared Monitor instance used for tracking time and detecting
 * system clock changes during training sessions.
 *
 * @return {Monitor} The singleton Monitor instance
 */
export function getMonitor() {
  return minuteTrackerInstance;
}

// Also export the class itself for direct instantiation if needed
export { Monitor };
