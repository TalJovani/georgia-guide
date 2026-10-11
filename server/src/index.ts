import express from "express";

const app = express();
const PORT = 4000;

app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});