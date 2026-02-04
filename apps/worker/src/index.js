require("dotenv").config();

const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const { QUEUE_NAMES } = require("./queues");

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.error("Missing REDIS_URL in environment.");
  process.exit(1);
}

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

const createWorker = (queueName) =>
  new Worker(
    queueName,
    async (job) => {
      console.log(`[${queueName}] job received`, {
        id: job.id,
        name: job.name,
        data: job.data,
      });
      return { status: "stub" };
    },
    { connection },
  );

const workers = Object.values(QUEUE_NAMES).map(createWorker);

const shutdown = async () => {
  console.log("Shutting down workers...");
  await Promise.all(workers.map((worker) => worker.close()));
  await connection.quit();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
