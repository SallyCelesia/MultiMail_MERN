const nodemailer = require("nodemailer");

const getSmtpConfig = () => {
    const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;
    const port = Number(SMTP_PORT);

    if (
        !SMTP_HOST?.trim() ||
        !Number.isInteger(port) ||
        port < 1 ||
        port > 65535 ||
        !["true", "false"].includes((SMTP_SECURE || "").toLowerCase()) ||
        !SMTP_USER ||
        !SMTP_PASS ||
        !MAIL_FROM?.trim()
    ) {
        throw new Error("Set valid SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, and MAIL_FROM values");
    }

    return {
        host: SMTP_HOST.trim(),
        port,
        secure: SMTP_SECURE.toLowerCase() === "true",
        user: SMTP_USER,
        pass: SMTP_PASS,
        from: MAIL_FROM.trim()
    };
};

const createTransporter = (config = getSmtpConfig()) => nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
        user: config.user,
        pass: config.pass
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000
});

module.exports = { createTransporter, getSmtpConfig };
