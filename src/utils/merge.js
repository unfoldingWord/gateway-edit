/**
 * Tests if a merge status object contains an error that should be reported.
 * Filters out the specific error case where a branch does not exist.
 * @param {Object} mergeStatus - The merge status object to test
 * @param {boolean} mergeStatus.error - Whether an error occurred during merge
 * @param {string} mergeStatus.message - The error message from the merge operation
 * @return {boolean} True if there is an error that should be reported, false otherwise
 */
export function testForMergeError(mergeStatus) {
  return mergeStatus.error && !/branch .* does not exist/.test(mergeStatus.message);
}

