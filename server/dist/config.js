"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const rootDir = process.cwd();
exports.config = {
    port: Number(process.env.PORT) || 3000,
    env: process.env.NODE_ENV || 'development',
    uploadDirs: {
        originals: path_1.default.resolve(rootDir, 'uploads', 'originals'),
        thumbnails: path_1.default.resolve(rootDir, 'uploads', 'thumbnails'),
    },
    idempotencyHeader: 'x-idempotency-key',
    shopify: {
        webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET || '',
    },
};
