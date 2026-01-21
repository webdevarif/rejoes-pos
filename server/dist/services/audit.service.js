"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logEvent = logEvent;
const prisma_1 = require("../prisma");
function getClient(client) {
    return client ?? prisma_1.prisma;
}
async function logEvent(memberId, action, metadata = {}, client) {
    const db = getClient(client);
    await db.auditEvent.create({
        data: {
            memberId,
            action,
            metadata: JSON.stringify(metadata),
        },
    });
}
