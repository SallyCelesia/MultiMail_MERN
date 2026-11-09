const nodemailer = require("nodemailer");

const createTransporter = (email, appPassword) => {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: email,
            pass: appPassword
        }
    });
};

module.exports = createTransporter;
