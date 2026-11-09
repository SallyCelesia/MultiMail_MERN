require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

app.use(cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173"
}));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => {
    res.json({ message: "MultiMail API is running" });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/mail", require("./routes/mailRoutes"));

const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Could not start server:", error.message);
        process.exit(1);
    });
