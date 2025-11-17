// Import the worker - webpack's worker-loader will handle this
import Worker from './AlignmentTrainerNextJS.worker';

/**
 * Creates an alignment worker
 * This function creates a new worker instance bundled by worker-loader
 */
export async function createAlignmentTrainingWorker() {
  try {
    console.log('Creating AlignmentTrainerNextJS worker...');
    // Create a new worker instance - worker-loader converts this import into a constructor
    const worker = new Worker();

    // Log when worker is successfully created
    console.log('AlignmentTrainerNextJS worker successfully created');
    return worker;
  } catch (error) {
    console.error('Failed to create alignment worker:', error);
    throw new Error('Unable to create alignment worker: ' + (error.message || 'Unknown error'));
  }
}
