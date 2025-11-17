import { AlignmentTrainerUtils } from "enhanced-word-aligner-rcl";
const {processTrainingData, START_TRAINING} = AlignmentTrainerUtils;

console.log("AlignmentTrainerNextJS.worker.js: Worker script loaded and started", self);

const ctx = self;

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  const messageData = event?.data;
  console.log("AlignmentTrainer called with:", messageData);
  if (messageData?.data && messageData.type === START_TRAINING) {
    processTrainingData(ctx, messageData.data);
  }
});

// Add a listener for uncaught errors in the worker
self.addEventListener('error', (error) => {
  console.error("Error inside worker:", error);
  self.postMessage({
    type: 'error',
    message: 'Uncaught error in worker',
    error: error.toString()
  });
});

// This export is required for worker-loader
export default {};
