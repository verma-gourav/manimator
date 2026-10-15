import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import fs from "fs";
import generateRoute from "../src/api/routes/generate.js";
import jobRoute from "../src/api/routes/job.js";

// Mock out database/queue layers completely
const mockSet = vi.fn();
const mockAdd = vi.fn();
const mockGetStoredJob = vi.fn();

vi.mock("../../jobs/store/jobStore.js", () => ({
    jobStore: { set: (...args: any[]) => mockSet(...args) },
}));

vi.mock("../../jobs/queue/renderQueue.js", () => ({
    renderQueue: { add: (...args: any[]) => mockAdd(...args) },
}));

vi.mock("../../jobs/store/jobHelpers.js", () => ({
    getStoredJob: (...args: any[]) => mockGetStoredJob(...args),
    updateStoredJob: vi.fn(),
}));

vi.mock("fs", async () => {
    const actual = await vi.importActual<typeof fs>("fs");
    return {
        ...actual,
        mkdirSync: vi.fn(),
    };
});

// Setup ephemeral testing application
const app = express();
app.use(express.json());
app.use("/api/v1/generate", generateRoute);
app.use("/api/v1/job", jobRoute);

describe("Express API Endpoints", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("POST /api/v1/generate", () => {
        it("should reject payload missing a prompt", async () => {
            const res = await request(app).post("/api/v1/generate").send({});
            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Prompt is required");
        });

        it("should enqueue valid prompt targets", async () => {
            mockSet.mockResolvedValue("OK");
            mockAdd.mockResolvedValue({});

            const res = await request(app)
                .post("/api/v1/generate")
                .send({ prompt: "Create a binary tree animation" });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe("queued");
            expect(res.body).toHaveProperty("jobId");
        });
    });

    describe("GET /api/v1/job/:jobId", () => {
        it("should emit 404 error if job record isn't tracking", async () => {
            mockGetStoredJob.mockResolvedValue(null);
            const res = await request(app).get("/api/v1/job/missing-id");
            expect(res.status).toBe(404);
        });

        it("should parse tracking logs for tracked IDs", async () => {
            mockGetStoredJob.mockResolvedValue({
                jobId: "test-id",
                status: "processing",
                stage: "rendering",
                progress: 45,
            });

            const res = await request(app).get("/api/v1/job/test-id");
            expect(res.status).toBe(200);
            expect(res.body.progress).toBe(45);
        });
    });
});
