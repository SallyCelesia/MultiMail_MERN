const User = require("../models/User");
const Mail = require("../models/Mail");
const { decrypt } = require("../utils/encryption");
const createTransporter = require("../utils/transporter");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sendMail = async (req, res) => {
    let mailRecord;

    try {
        const { subject, body, recipients } = req.body;

        if (
            typeof subject !== "string" || !subject.trim() ||
            typeof body !== "string" || !body.trim() ||
            !Array.isArray(recipients) || recipients.length === 0
        ) {
            return res.status(400).json({
                message: "Subject, body and at least one recipient are required"
            });
        }

        const uniqueRecipients = [...new Set(
            recipients
                .filter((value) => typeof value === "string")
                .map((value) => value.trim().toLowerCase())
                .filter((value) => emailPattern.test(value))
        )];

        if (uniqueRecipients.length === 0) {
            return res.status(400).json({ message: "No valid recipient emails found" });
        }

        const user = await User.findById(req.userId).select("+appPassword");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const transporter = createTransporter(
            user.email,
            decrypt(user.appPassword)
        );

        mailRecord = await Mail.create({
            userId: user._id,
            subject: subject.trim(),
            body,
            recipients: uniqueRecipients.map((email) => ({
                email,
                status: "pending"
            })),
            status: "failed"
        });

        // Sequential sending is intentionally simple for this learning project.
        for (let index = 0; index < uniqueRecipients.length; index++) {
            const recipient = uniqueRecipients[index];

            try {
                await transporter.sendMail({
                    from: user.email,
                    to: recipient,
                    subject: subject.trim(),
                    text: body
                });

                mailRecord.recipients[index].status = "sent";
            } catch (error) {
                mailRecord.recipients[index].status = "failed";
                mailRecord.recipients[index].error = String(error.message).slice(0, 500);
                console.error(`Delivery failed for ${recipient}:`, error.message);
            }

            // Persist progress so a server interruption does not erase completed results.
            await mailRecord.save();
        }

        const sent = mailRecord.recipients.filter((item) => item.status === "sent").length;
        const failed = mailRecord.recipients.filter((item) => item.status === "failed").length;

        mailRecord.status = sent === uniqueRecipients.length
            ? "sent"
            : sent > 0 ? "partial" : "failed";

        await mailRecord.save();

        return res.status(200).json({
            message: "Email sending process completed",
            total: uniqueRecipients.length,
            sent,
            failed,
            status: mailRecord.status
        });
    } catch (error) {
        console.error("Send mail error:", error.message);

        if (mailRecord) {
            mailRecord.status = "failed";
            await mailRecord.save().catch((saveError) => {
                console.error("Could not save mail status:", saveError.message);
            });
        }

        return res.status(500).json({ message: "Email sending failed" });
    }
};

const getHistory = async (req, res) => {
    try {
        const history = await Mail.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json(history);
    } catch (error) {
        console.error("History error:", error.message);
        return res.status(500).json({ message: "Unable to fetch mail history" });
    }
};

module.exports = { sendMail, getHistory };
