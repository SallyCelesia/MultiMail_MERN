const getSameSite = () => {
    const sameSite = (process.env.COOKIE_SAME_SITE || "lax").toLowerCase();
    if (!["lax", "strict", "none"].includes(sameSite)) {
        throw new Error("COOKIE_SAME_SITE must be lax, strict, or none");
    }
    return sameSite;
};

const getSessionCookieOptions = () => {
    const sameSite = getSameSite();
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" || sameSite === "none",
        sameSite,
        path: "/",
        maxAge: 24 * 60 * 60 * 1000
    };
};

module.exports = { getSessionCookieOptions };
