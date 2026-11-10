require("dotenv").config();

const { isValidEmail, isValidSender } = require("./utils/email");
const { createTransporter, getSmtpConfig } = require("./utils/transporter");

async function sendTestEmail() {
    const recipient = process.argv[2]?.trim();
    if (!recipient || !isValidEmail(recipient)) {
        throw new Error("Provide a valid test recipient: npm run test:smtp -- you@example.com");
    }

    const config = getSmtpConfig();
    if (!isValidSender(config.from)) {
        throw new Error("MAIL_FROM must be a valid email address, optionally with a display name");
    }

    const transporter = createTransporter(config);
    try {
        await transporter.verify();
        const result = await transporter.sendMail({
            from: config.from,
            to: recipient,
            subject: "MultiMail SMTP test",
            text: "This is a test email sent through the configured SMTP server."
        });
        console.log(`SMTP accepted the test email for ${recipient}.`);
        if (result.messageId) {
            console.log(`Message ID: ${result.messageId}`);
        }
    } finally {
        transporter.close();
    }
}

if (require.main === module) {
    sendTestEmail().catch((error) => {
        console.error("SMTP test failed:", error.message);
        process.exitCode = 1;
    });
}

module.exports = sendTestEmail;
