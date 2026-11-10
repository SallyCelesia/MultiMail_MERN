const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getSessionCookieOptions } = require("../utils/sessionCookie");

const configuredUser = () => {
    // const username = process.env.AUTH_USERNAME?.trim().toLowerCase();
    const username = 'sallycelesia@gmail.com';
    const password = 'MyP1sswor4';
    const jwtSecret = process.env.JWT_SECRET;

    if (!username || !password || Buffer.byteLength(password, "utf8") > 72 || !jwtSecret || jwtSecret.length < 32) {
        throw new Error("Set AUTH_USERNAME, AUTH_PASSWORD, and a JWT_SECRET of at least 32 characters");
    }

    return { username, password, jwtSecret };
};

const getConfiguredUser = async (username, password) => {
    let user = await User.findOne({ email: username }).select("+password");

    if (!user) {
        const passwordHash = await bcrypt.hash(password, 12);
        try {
            user = await User.create({ email: username, password: passwordHash });
        } catch (error) {
            if (error.code !== 11000) throw error;
            user = await User.findOne({ email: username }).select("+password");
        }
    }

    if (!user) {
        throw new Error("Could not load the configured user");
    }

    if (!await bcrypt.compare(password, user.password)) {
        user.password = await bcrypt.hash(password, 12);
        await user.save();
    }

    return user;
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        if (Buffer.byteLength(password, "utf8") > 72) {
            return res.status(400).json({ message: "Password must be at most 72 UTF-8 bytes" });
        }

        let credentials;

        try {
            credentials = configuredUser();
        } catch (error) {
            console.error("Authentication configuration error:", error.message);
            return res.status(503).json({ message: "Authentication is not configured on the server" });
        }

        if (username.trim().toLowerCase() !== credentials.username) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const user = await getConfiguredUser(credentials.username, credentials.password);
        if (!await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        let cookieOptions;
        try {
            cookieOptions = getSessionCookieOptions();
        } catch (error) {
            console.error("Session cookie configuration error:", error.message);
            return res.status(503).json({ message: "Session configuration is not valid" });
        }

        const token = jwt.sign(
            { id: user._id.toString() },
            credentials.jwtSecret,
            { expiresIn: "1d" }
        );
        res.cookie("token", token, cookieOptions);

        return res.status(200).json({
            message: "Login successful",
            username: user.email
        });
    } catch (error) {
        console.error("Login error:", error.message);
        return res.status(500).json({ message: "Login failed" });
    }
};

module.exports = { login };
