import mongoose from "mongoose";

export const connection = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            dbName: "DIGITAL_AUCTION_STORE",
        });

        console.log(` Connected to database: ${conn.connection.db.databaseName}`);
    } catch (err) {
        console.error(` Database connection failed: ${err.message}`);
        process.exit(1);
    }
};

