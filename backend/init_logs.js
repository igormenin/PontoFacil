import { initLogTable } from './src/utils/log.service.js';

async function run() {
  await initLogTable();
  process.exit(0);
}

run();
