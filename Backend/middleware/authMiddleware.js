const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        const authorization = req.headers.authorization || "";
        const [scheme, bearerToken] = authorization.split(" ");
        const tokenCookie = (req.headers.cookie || "")
            .split(";")
            .map((cookie) => cookie.trim())
            .find((cookie) => cookie.startsWith("token="));
        const token = tokenCookie ? tokenCookie.slice("token=".length) : (
            scheme === "Bearer" ? bearerToken : ""
        );

        if (!token) {
            return res.status(401).json({ message: "Authentication token required" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

module.exports = authMiddleware;
