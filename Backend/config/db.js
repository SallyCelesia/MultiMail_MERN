const mongoose = require("mongoose");

let connectionPromise;

const connectDB = async () => {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
        throw new Error("MONGODB_URI is required");
    }

    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (mongoose.connection.readyState === 0) {
        connectionPromise = undefined;
    }

    if (!connectionPromise) {
        connectionPromise = mongoose.connect(uri)
            .then(() => {
                console.log("MongoDB connected successfully");
                return mongoose.connection;
            })
            .catch((error) => {
                connectionPromise = undefined;
                throw error;
            });
    }

    return connectionPromise;
};

module.exports = connectDB;
