import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import http from "http";
import { WebSocket } from "ws";
import { createWSServer, emitJobUpdate } from "../src/api/ws/wsServer.js";

// Handle Redis Client subscription side-effects
vi.mock("../../jobs/store/pubsub.js", () => ({
    subClient: {
        psubscribe: vi.fn((pattern, cb) => cb(null, 1)),
        on: vi.fn(),
    },
}));

describe("WebSocket Broadcast System", () => {
    let server: http.Server;
    let port: number;

    beforeEach(() => {
        server = http.createServer();
        createWSServer(server);
        server.listen(0);
        port = (server.address() as any).port;
    });

    afterEach(() => {
        server.close();
    });

    it("should securely reject socket initializations lacking query identifiers", () => {
        return new Promise<void>((resolve) => {
            const ws = new WebSocket(`ws://localhost:${port}`);
            ws.on("close", () => {
                resolve(); // Pass condition if closed early
            });
        });
    });

    it("should stream transactional frame updates over isolated rooms", () => {
        return new Promise<void>((resolve) => {
            const targetId = "render-token-abc";
            const ws = new WebSocket(
                `ws://localhost:${port}?jobId=${targetId}`,
            );

            ws.on("open", () => {
                // Trigger simulation loop
                emitJobUpdate(targetId, { progress: 85, status: "processing" });
            });

            ws.on("message", (raw) => {
                const payload = JSON.parse(raw.toString());
                expect(payload.progress).toBe(85);
                ws.close();
                resolve();
            });
        });
    });
});
