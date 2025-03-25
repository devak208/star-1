import Redis from "ioredis";

const redis = new Redis({
  host: "localhost", // or use "redis-container" if running inside another Docker container
  port: 6379
});

redis.on("connect", () => {
  console.log("✅ Redis is configured and setup completed.");
});

redis.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});

export default redis;
