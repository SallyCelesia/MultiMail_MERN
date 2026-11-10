const mongoose = require("mongoose");

const recipientSchema = new mongoose.Schema({
    email: { type: String, required: true },
    status: {
        type: String,
        enum: ["sent", "failed", "pending"],
        default: "pending"
    },
    error: { type: String, default: "" }
}, { _id: false });

const mailSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    body: { type: String, required: true },
    recipients: [recipientSchema],
    status: {
        type: String,
        enum: ["sent", "failed", "partial"],
        default: "failed"
    }
}, { timestamps: true });

module.exports = mongoose.model("Mail", mailSchema);
