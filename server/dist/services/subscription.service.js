"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapShopifyPlanToTier = mapShopifyPlanToTier;
exports.handleSubscriptionEvent = handleSubscriptionEvent;
const prisma_1 = require("../prisma");
const audit_service_1 = require("./audit.service");
const PLAN_HANDLE_TO_TIER = {
    basic: 'BASIC',
    plus: 'PLUS',
    premium: 'PREMIUM',
};
function mapShopifyPlanToTier(handle) {
    const key = handle.toLowerCase();
    const tier = PLAN_HANDLE_TO_TIER[key];
    if (!tier) {
        throw new Error(`Unsupported plan handle: ${handle}`);
    }
    return tier;
}
const getClient = (client) => client ?? prisma_1.prisma;
async function handleSubscriptionEvent(payload) {
    const tier = mapShopifyPlanToTier(payload.data.planHandle);
    const status = payload.data.status.toUpperCase();
    const cycleStart = new Date(payload.data.cycleStart);
    const cycleEnd = new Date(payload.data.cycleEnd);
    const member = await prisma_1.prisma.member.upsert({
        where: { shopifyCustomerId: payload.data.shopifyCustomerId },
        update: {
            tier,
            status,
            cycleStart,
            cycleEnd,
            cardToken: payload.data.cardToken,
        },
        create: {
            shopifyCustomerId: payload.data.shopifyCustomerId,
            cardToken: payload.data.cardToken,
            tier,
            status,
            cycleStart,
            cycleEnd,
        },
    });
    await (0, audit_service_1.logEvent)(member.id, `subscription_${payload.type}`, payload.data);
    return member;
}
