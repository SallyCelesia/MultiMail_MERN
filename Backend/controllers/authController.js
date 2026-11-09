const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { encrypt, decrypt } = require("../utils/encryption");

const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const signup = async (req, res) => {
    try {
        const { email, password, appPassword } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            typeof appPassword !== "string" ||
            !email.trim() ||
            !password ||
            !appPassword.trim()
        ) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (!validEmail.test(normalizedEmail)) {
            return res.status(400).json({ message: "Enter a valid email address" });
        }

        if (password.length < 6 || !/\d/.test(password) || !/[^A-Za-z0-9\s]/.test(password)) {
            return res.status(400).json({
                message: "Password must be at least 6 characters and include a number and a symbol"
            });
        }

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({ message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await User.create({
            email: normalizedEmail,
            password: hashedPassword,
            appPassword: encrypt(appPassword.replace(/\s/g, ""))
        });

        return res.status(201).json({ message: "Registration successful" });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "Email already registered" });
        }
        console.error("Signup error:", error.message);
        return res.status(500).json({ message: "Registration failed" });
    }
};

// const login = async (req, res) => {
//     try {
//         const { email, password, appPassword } = req.body;
//         console.log("typee--",appPassword, typeof appPassword)
//         if (
//             typeof email !== "string" ||
//             typeof password !== "string" ||
//             typeof appPassword !== "string"
//         ) {
//             return res.status(400).json({ message: "Email and credentials are required" });
//         }

//         const user = await User.findOne({
//             email: email.trim().toLowerCase()
//         }).select("+appPassword");

//         if (!user) {
//             return res.status(401).json({ message: "Invalid credentials" });
//         }

//         const passwordMatch = await bcrypt.compare(password, user.password);
//         const storedAppPassword = decrypt(user.appPassword);
//         const submitted = Buffer.from(appPassword.replace(/\s/g, ""));
//         const stored = Buffer.from(storedAppPassword);

//         const appPasswordMatch =
//             submitted.length === stored.length &&
//             crypto.timingSafeEqual(submitted, stored);

//         if (!passwordMatch || !appPasswordMatch) {
//             return res.status(401).json({ message: "Invalid credentials" });
//         }

//         const token = jwt.sign(
//             { id: user._id.toString() },
//             process.env.JWT_SECRET,
//             { expiresIn: "1d" }
//         );

//         return res.status(200).json({
//             message: "Login successful",
//             token,
//             email: user.email
//         });
//     } 
//     catch (error) {
//         console.error("Login error:", error.message);
//         return res.status(500).json({ message: "Login failed" });
//     }
// };
const login = async (req, res) => {
    try {
        const { email, password, appPassword } = req.body;

        console.log("Login request received:", email);

        // Step 1: Find user
        const user = await User.findOne({
            email: email.trim().toLowerCase()
        }).select("+appPassword");

        if (!user) {
            console.log("DEBUG: User not found");

            return res.status(401).json({
                message: "User not registered"
            });
        }

        console.log("DEBUG: User found");

        // Step 2: Check account password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        console.log("DEBUG: Password match:", passwordMatch);

        // Step 3: Decrypt stored Gmail App Password
        const storedAppPassword = decrypt(user.appPassword);

        const enteredAppPassword = appPassword.replace(/\s/g, "");
        const savedAppPassword = storedAppPassword.replace(/\s/g, "");

        const appPasswordMatch =
            enteredAppPassword === savedAppPassword;

        console.log(
            "DEBUG: App Password match:",
            appPasswordMatch
        );

        if (!passwordMatch || !appPasswordMatch) {
            return res.status(401).json({
                message: "Password or App Password is incorrect"
            });
        }

        // Step 4: Generate JWT
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        console.log("DEBUG: JWT generated successfully");

        return res.status(200).json({
            message: "Login successful",
            token,
            email: user.email
        });

    } catch (error) {

        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
            message: "Login failed due to server error"
        });
    }
};

module.exports = { signup, login };
