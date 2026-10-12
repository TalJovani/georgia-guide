import "dotenv/config";
import cookieParser from "cookie-parser";
import express from "express";
import { prisma } from "./db.js";
import { accountRouter } from "./routes/account.js";
import { authRouter } from "./routes/auth.js";
import { guideRouter } from "./routes/guide.js";
import { tripRequestsRouter } from "./routes/tripRequests.js";

const app = express();
const PORT = 4000;

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: "ok", database: "ok" });
    } catch (error) {
        console.error("Database health check failed:", error);
        res.status(503).json({ status: "error", database: "unreachable" });
    }
});

app.use("/api/auth", authRouter);
app.use("/api/account", accountRouter);
app.use("/api/trip-requests", tripRequestsRouter);
app.use("/api/guide", guideRouter);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
