import "dotenv/config";
import express from "express";
import { prisma } from "./db.js";

const app = express();
const PORT = 4000;

app.get("/api/health", async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: "ok", database: "ok" });
    } catch (error) {
        console.error("Database health check failed:", error);
        res.status(503).json({ status: "error", database: "unreachable" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
