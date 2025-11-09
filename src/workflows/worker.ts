#!/usr/bin/env node
import { Worker } from '@temporalio/worker';
import * as activities from './activities/payment.activities';

async function run() {
  console.log('Starting Temporal Worker for Payment Processing...');

  const worker = await Worker.create({
    workflowsPath: require.resolve('./payment-processing.workflow'),
    activities,
    taskQueue: 'payment-processing',
    maxConcurrentActivityTaskExecutions: 10,
    maxConcurrentWorkflowTaskExecutions: 10,
  });

  console.log('Worker started successfully!');
  console.log('Listening for tasks on queue: payment-processing');

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down worker...');
    await worker.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down worker...');
    await worker.shutdown();
    process.exit(0);
  });

  await worker.run();
}

run().catch((err) => {
  console.error('Worker failed:', err);
  process.exit(1);
});