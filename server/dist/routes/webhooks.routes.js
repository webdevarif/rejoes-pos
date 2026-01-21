"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shopifyWebhook_1 = require("../middlewares/shopifyWebhook");
const subscription_service_1 = require("../services/subscription.service");
const prisma_1 = require("../prisma");
const router = (0, express_1.Router)();
router.post('/subscription', shopifyWebhook_1.verifyShopifyWebhook, async (req, res, next) => {
    try {
        const payload = req.body;
        await (0, subscription_service_1.handleSubscriptionEvent)(payload);
        return res.status(200).json({ status: 'ok' });
    }
    catch (error) {
        return next(error);
    }
});
router.post('/customers/delete', shopifyWebhook_1.verifyShopifyWebhook, async (req, res, next) => {
    try {
        const { shopifyCustomerId } = req.body;
        // Delete all loans and audit events for this customer
        await prisma_1.prisma.member.delete({
            where: { shopifyCustomerId }
        });
        return res.status(200).json({ status: 'ok' });
    }
    catch (error) {
        return next(error);
    }
});
exports.default = router;
