const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { sendMail, getHistory } = require("../controllers/mailController");

const router = express.Router();

router.post("/send", authMiddleware, sendMail);
router.get("/history", authMiddleware, getHistory);

module.exports = router;
