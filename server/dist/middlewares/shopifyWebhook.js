"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyShopifyWebhook = verifyShopifyWebhook;
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../config");
const SHOPIFY_HMAC_HEADER = 'x-shopify-hmac-sha256';
function verifyShopifyWebhook(req, res, next) {
    if (!config_1.config.shopify.webhookSecret) {
        return res.status(500).json({ message: 'Shopify webhook secret not configured' });
    }
    const signature = req.header(SHOPIFY_HMAC_HEADER);
    if (!signature || !req.rawBody) {
        return res.status(401).json({ message: 'Invalid webhook signature' });
    }
    const computed = crypto_1.default
        .createHmac('sha256', config_1.config.shopify.webhookSecret)
        .update(req.rawBody)
        .digest('base64');
    if (computed !== signature) {
        return res.status(401).json({ message: 'Invalid webhook signature' });
    }
    return next();
}
