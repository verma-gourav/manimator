import { Redis } from "ioredis";

export const pubClient = new Redis({
  host: "localhost",
  port: 6379,
});

export const subClient = new Redis({
  host: "localhost",
  port: 6379,
});
