import { WebSocket, WebSocketServer } from "ws";
import { subClient } from "../../jobs/store/pubsub.js";

const clients = new Map<string, Set<WebSocket>>();

export const createWSServer = (server: any) => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    const jobId = new URL(req.url!, "http://localhost").searchParams.get(
      "jobId",
    );

    if (!jobId) return ws.close();

    if (!clients.has(jobId)) {
      clients.set(jobId, new Set());
    }

    clients.get(jobId)!.add(ws);

    ws.on("close", () => {
      clients.get(jobId)!.delete(ws);
    });
  });
};

/* --- emit job update --- */
export const emitJobUpdate = (jobId: string, payload: any) => {
  const sockets = clients.get(jobId);
  if (!sockets) return;

  for (const ws of sockets) {
    ws.send(JSON.stringify(payload));
  }
};

/* --- subscribe to all job progress channels --- */
subClient.psubscribe("job-progress:*", (err, count) => {
  if (err) {
    console.error("Failed to subscribe:", err);
  } else {
    console.log("Subscribed to job-progress:*", count);
  }
});

subClient.on("pmessage", (_pattern, channel, message) => {
  const jobId = channel.split(":")[1];
  const data = JSON.parse(message);

  emitJobUpdate(jobId, data);
});
