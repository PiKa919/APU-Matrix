import mongoose from 'mongoose';

/**
 * Get the MongoDB connection URI from environment variables.
 * Supports: MONGODB_URI, or MONGODB_URL (which may be a full connection string).
 */
function getMongoURI() {
    // Check for explicit MONGODB_URI first
    if (process.env.MONGODB_URI) {
        return process.env.MONGODB_URI;
    }

    // MONGODB_URL may be a full connection string (e.g., from MongoDB Atlas dashboard)
    if (process.env.MONGODB_URL) {
        return process.env.MONGODB_URL;
    }

    return null;
}

const MONGODB_URI = getMongoURI();

if (!MONGODB_URI) {
    console.warn('MongoDB credentials not found. Set MONGODB_URI or MONGODB_URL.');
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
    // Re-check in case env vars were loaded after module init
    const uri = MONGODB_URI || getMongoURI();
    if (!uri) return null;

    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
            console.log('✅ Connected to MongoDB');
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error('❌ MongoDB connection failed:', e.message);
        throw e;
    }

    return cached.conn;
}

export default connectToDatabase;
