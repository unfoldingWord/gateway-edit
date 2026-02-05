const overflowAmount = 1.1;
const trackIntervalMinutes = 1;
const minuteInMilliseconds = 60 * 1000;
let minuteCounter = 0;
let unPauseCallback = null;
let minuteTimer = null;
let timeSinceValidation = 0

/**
 * Starts a minute counter for tracking training duration
 *
 * Initializes a counter that increments every minute to track
 * training duration, even if the system clock jumps (e.g., during sleep).
 *
 * @returns {NodeJS.Timeout} Timer interval ID
 */
export function startMinuteTracker(callback) {
  console.log('startMinuteTracker() -️ Timer started');

  unPauseCallback = callback;

  let startTime = Date.now(); // Capture start time
  minuteTimer = setInterval(() => {
    minuteCounter++;
    console.log(`startMinuteTracker() - ${minuteCounter} minute(s) elapsed`);
    let stopTime = timeSinceValidation = Date.now();
    const elapsedMinutes = getElapsedMinutes(startTime, stopTime);
    if (elapsedMinutes > trackIntervalMinutes * overflowAmount) {
      console.log(`startMinuteTracker() - ${elapsedMinutes} actually elapsed during ${trackIntervalMinutes} time`);
      const minSinceValidation = getMinuteCounter(timeSinceValidation, stopTime);
      unPauseCallback?.(elapsedMinutes, minSinceValidation);
    }
    startTime = Date.now();
  }, trackIntervalMinutes * minuteInMilliseconds); // 60,000 ms = 1 minute

  return minuteTimer;
}

/**
 * Stops the minute tracker
 *
 * Cleans up the timer that tracks training duration.
 */
export function stopMinuteTracker() {
  unPauseCallback = null;
  console.log(`stopMinuteTracker() - stopped`);
  if (minuteTimer) {
    clearInterval(minuteTimer);
    minuteTimer = null;
  }
}

/**
 * Gets the current minute counter value
 *
 * @returns {number} Minutes elapsed during training
 */
export function getMinuteCounter() {
  return minuteCounter;
}

/**
 * Resets the minute counter to zero.
 *
 * @return {void} This method does not return a value.
 */
export function resetMinuteCounter() {
  minuteCounter = 0;
  timeSinceValidation = Date.now();
}

/**
 * Calculates elapsed minutes between times
 *
 * @param {number} startTime - The time at start
 * @param {number} endTime - The time at end
 * @returns {number} Elapsed time in minutes
 */
export function getElapsedMinutes(startTime, endTime) {
  const elapsed = endTime - startTime;
  return elapsed / (1000 * 60);
}

