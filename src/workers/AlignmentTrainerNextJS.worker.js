import { AlignmentTrainerUtils } from "enhanced-word-aligner-rcl";

console.log("AlignmentTrainerNextJS.worker.js: Worker script loaded and started", self);
const TRAINING_RESULTS = 'trainingResults';

/**
 * Processes the training data and performs word alignment training sending results back to main thread
 * @param data - The training and testing data received from the main thread
 */
async function processTrainingData(data) {
  self.postMessage({ type: 'log', message: 'Training worker has started' });
  console.log("Training worker has started");

  try {
    const trainingModelResults = await AlignmentTrainerUtils.createTrainedWordAlignerModel(data);
    const trainedModel = trainingModelResults.wordAlignerModel.save();
    delete trainingModelResults.wordAlignerModel; // trim the model to save memory
    const workerResults = {
      type: TRAINING_RESULTS,
      message: 'Worker has finished',
      trainedModel,
      ...trainingModelResults,
    }
    self.postMessage(workerResults);
  } catch (error) {
    console.error("Worker error:", error);
    self.postMessage({
      type: TRAINING_RESULTS,
      message: 'There was an error while training the word map.',
      error: error.toString()
    });
  }
}

// Add a listener for uncaught errors in the worker
self.addEventListener('error', (error) => {
  console.error("Error inside worker:", error);
  self.postMessage({
    type: 'error',
    message: 'Uncaught error in worker',
    error: error.toString()
  });
});

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  const messageData = event?.data;
  console.log("AlignmentTrainer received message:", messageData);

  // Send acknowledgment back to main thread
  self.postMessage({ type: 'ack', received: messageData });

  if (messageData?.data && messageData.type === "startTraining") {
    processTrainingData(messageData.data);
  }
});

// This export is required for worker-loader
export default {};
