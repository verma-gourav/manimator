import express from "express";
import generateRoute from "./api/routes/generate.js";
import jobRoute from "./api/routes/job.js";

const app = express();
app.use(express.json());

app.use("/api/v1/generate", generateRoute);
app.use("/api/v1/job", jobRoute);

app.listen(3000);
