require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || (
    process.env.NODE_ENV === "production" ? "" : "http://localhost:5173"
))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        callback(null, !origin || allowedOrigins.includes(origin));
    }
}));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => {
    res.json({ message: "MultiMail API is running" });
});

app.use("/api", async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error("Could not connect to MongoDB:", error.message);
        res.status(503).json({ message: "Database unavailable" });
    }
});

app.use("/api/mail", require("./routes/mailRoutes"));

if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
