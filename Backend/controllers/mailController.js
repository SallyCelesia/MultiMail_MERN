const Mail = require("../models/Mail");
const { isValidEmail, isValidSender } = require("../utils/email");
const { createTransporter, getSmtpConfig } = require("../utils/transporter");

const getRecipientLimit = () => {
    const configuredLimit = process.env.MAX_CAMPAIGN_RECIPIENTS || "100";
    const limit = Number(configuredLimit);

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new Error("MAX_CAMPAIGN_RECIPIENTS must be an integer between 1 and 100");
    }

    return limit;
};

const sendMail = async (req, res) => {
    let mailRecord;
    let transporter;

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
                .filter(isValidEmail)
        )];

        if (uniqueRecipients.length === 0) {
            return res.status(400).json({ message: "No valid recipient emails found" });
        }

        let maxRecipients;
        try {
            maxRecipients = getRecipientLimit();
        } catch (error) {
            console.error("Mail configuration error:", error.message);
            return res.status(503).json({ message: "Email sending is not configured correctly" });
        }

        if (uniqueRecipients.length > maxRecipients) {
            return res.status(400).json({
                message: `A campaign can include at most ${maxRecipients} recipients`
            });
        }

        let smtpConfig;
        try {
            smtpConfig = getSmtpConfig();
        } catch (error) {
            console.error("SMTP configuration error:", error.message);
            return res.status(503).json({ message: "SMTP email sending is not configured correctly" });
        }

        if (!isValidSender(smtpConfig.from)) {
            return res.status(503).json({
                message: "MAIL_FROM must be a valid address, such as MultiMail <you@example.com>"
            });
        }

        mailRecord = await Mail.create({
            subject: subject.trim(),
            body,
            recipients: uniqueRecipients.map((email) => ({
                email,
                status: "pending"
            })),
            status: "failed"
        });

        transporter = createTransporter(smtpConfig);
        await Promise.all(mailRecord.recipients.map(async (recipient) => {
            try {
                await transporter.sendMail({
                    from: smtpConfig.from,
                    to: recipient.email,
                    subject: subject.trim(),
                    text: body
                });
                recipient.status = "sent";
            } catch (error) {
                recipient.status = "failed";
                recipient.error = String(error.message).slice(0, 500);
                console.error(`SMTP delivery failed for ${recipient.email}:`, error.message);
            }
        }));

        const sent = mailRecord.recipients.filter((item) => item.status === "sent").length;
        const failed = mailRecord.recipients.filter((item) => item.status === "failed").length;

        mailRecord.status = sent === uniqueRecipients.length
            ? "sent"
            : sent > 0 ? "partial" : "failed";

        await mailRecord.save();
        transporter.close();
        transporter = undefined;

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
            try {
                await mailRecord.save();
            } catch (saveError) {
                console.error("Could not save mail status:", saveError.message);
            }
        }

        return res.status(500).json({ message: "Email sending failed" });
    } finally {
        if (transporter) {
            transporter.close();
        }
    }
};

const getHistory = async (req, res) => {
    try {
        const history = await Mail.find()
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json(history);
    } catch (error) {
        console.error("History error:", error.message);
        return res.status(500).json({ message: "Unable to fetch mail history" });
    }
};

module.exports = { sendMail, getHistory };
