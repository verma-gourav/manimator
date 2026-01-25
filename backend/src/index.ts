import express from "express";
import http from "http";
import generateRoute from "./api/routes/generate.js";
import jobRoute from "./api/routes/job.js";
import "dotenv/config";
import cors from "cors";
import { createWSServer } from "./api/ws/wsServer.js";

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: `${process.env.FRONTEND_URL}`,
    credentials: true,
  }),
);

const server = http.createServer(app);
createWSServer(server);

app.use("/api/v1/generate", generateRoute);
app.use("/api/v1/job", jobRoute);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`HTTP + WS server running on port ${PORT}`);
});
