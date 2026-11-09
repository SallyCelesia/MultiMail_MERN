const nodemailer = require("nodemailer");

const createTransporter = (email, appPassword) => {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: email,
            pass: appPassword
        },
        connectionTimeout: 30_000,
        greetingTimeout: 30_000,
        socketTimeout: 60_000
    });
};

module.exports = createTransporter;
