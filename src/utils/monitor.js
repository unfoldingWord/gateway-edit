
let minuteCounter = 0;
let minuteTimer = null;
let unPauseCallback = null;
const trackIntervalMinutes = 1;

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
    let stopTime = Date.now();
    const elapsedMinutes = getElapsedMinutes(startTime, stopTime);
    if (elapsedMinutes > trackIntervalMinutes * 1.1) {
      console.log(`startMinuteTracker() - ${elapsedMinutes} actually elapsed during ${trackIntervalMinutes} time`);
      unPauseCallback?.(elapsedMinutes, trackIntervalMinutes);
    }
    startTime = Date.now();
  }, trackIntervalMinutes * 60 * 1000); // 60,000 ms = 1 minute

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
function getMinuteCounter() {
  return minuteCounter;
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

