const express = require("express");
const { sendMail, getHistory } = require("../controllers/mailController");

const router = express.Router();

router.post("/send", sendMail);
router.get("/history", getHistory);

module.exports = router;
