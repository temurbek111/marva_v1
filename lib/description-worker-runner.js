// Simple runner for the description worker
// Run with: node lib/description-worker-runner.js

const fetch = require('node-fetch');

const API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ? `http://localhost:3000/api/blackpaper/worker` : 'http://localhost:3000/api/blackpaper/worker'; // Adjust for production

async function runWorker() {
  try {
    console.log('Running description worker...');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    console.log('Worker result:', result);

    if (result.message === 'No pending items to process') {
      console.log('No work to do, sleeping...');
    }
  } catch (error) {
    console.error('Worker error:', error);
  }
}

async function main() {
  console.log('Starting description worker runner...');
  while (true) {
    await runWorker();
    await new Promise(resolve => setTimeout(resolve, 60000)); // Run every 60 seconds
  }
}

main().catch(console.error);