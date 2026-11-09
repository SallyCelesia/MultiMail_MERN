const crypto = require("crypto");

const encodedKey = process.env.SMTP_CREDENTIALS_KEY || "";
const key = Buffer.from(encodedKey, "base64");

if (key.length !== 32) {
    throw new Error("SMTP_CREDENTIALS_KEY must be a base64-encoded 32-byte key");
}

const encrypt = (plainText) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([
        cipher.update(plainText, "utf8"),
        cipher.final()
    ]);
    const authTag = cipher.getAuthTag();

    return [
        iv.toString("hex"),
        authTag.toString("hex"),
        encrypted.toString("hex")
    ].join(":");
};

const decrypt = (payload) => {
    const parts = payload.split(":");
    if (parts.length !== 3) {
        throw new Error("Stored SMTP credential has an invalid format");
    }

    const [ivHex, tagHex, encryptedHex] = parts;
    const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        key,
        Buffer.from(ivHex, "hex")
    );
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));

    return Buffer.concat([
        decipher.update(Buffer.from(encryptedHex, "hex")),
        decipher.final()
    ]).toString("utf8");
};

module.exports = { encrypt, decrypt };
