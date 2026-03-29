import { config } from '../config';

type Task = () => Promise<void>;

const queue: Task[] = [];
let active = 0;

export const enqueue = (task: Task) => {
  queue.push(task);
  processQueue();
};

const processQueue = () => {
  if (active >= config.maxConcurrentDownloads) return;
  const task = queue.shift();
  if (!task) return;

  active++;
  task().finally(() => {
    active--;
    processQueue();
  });
};

export const getQueueLength = () => queue.length;
export const getActiveCount = () => active;
