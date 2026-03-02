import mongoose from 'mongoose';

const DeviceSchema = new mongoose.Schema({
    modelName: {
        type: String,
        required: true,
        unique: true,
    },
    score: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: false,
    },
    brand: {
        type: String,
        required: false,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    }
});

export default mongoose.models.Device || mongoose.model('Device', DeviceSchema);
