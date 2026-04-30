import mongoose from 'mongoose';

const DeviceSchema = new mongoose.Schema({
    modelName: {
        type: String,
        required: true,
    },
    score: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: false,
    },
    priceCurrency: {
        type: String,
        required: false,
    },
    priceRaw: {
        type: String,
        required: false,
    },
    brand: {
        type: String,
        required: false,
    },
    category: {
        type: String,
        required: false,
        enum: ['android', 'android_lite', 'android_soc', 'android_ai_phone', 'android_ai_llm', 'ios'],
    },
    chipset: {
        type: String,
        required: false,
    },
    cpuScore: {
        type: Number,
        required: false,
    },
    gpuScore: {
        type: Number,
        required: false,
    },
    memScore: {
        type: Number,
        required: false,
    },
    uxScore: {
        type: Number,
        required: false,
    },
    ram: {
        type: String,
        required: false,
    },
    storage: {
        type: String,
        required: false,
    },
    releaseDate: {
        type: String,
        required: false,
    },
    metadataSources: {
        brand: { type: String, required: false },
        price: { type: String, required: false },
        releaseDate: { type: String, required: false },
        chipset: { type: String, required: false },
        ram: { type: String, required: false },
        storage: { type: String, required: false },
    },
    sourceUrls: {
        gsmarena: { type: String, required: false },
    },
    enrichmentConfidence: {
        type: Number,
        required: false,
    },
    lastEnrichedAt: {
        type: Date,
        required: false,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    }
});

// Compound unique index: same model can appear in different categories
DeviceSchema.index({ modelName: 1, category: 1 }, { unique: true });

export default mongoose.models.Device || mongoose.model('Device', DeviceSchema);
