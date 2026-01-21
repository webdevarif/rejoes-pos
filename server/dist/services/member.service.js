"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMemberByCard = getMemberByCard;
exports.resetCountersIfNewCycle = resetCountersIfNewCycle;
exports.validateMemberActive = validateMemberActive;
exports.validateMemberCanCheckout = validateMemberCanCheckout;
exports.validateSwapAllowance = validateSwapAllowance;
exports.getMemberById = getMemberById;
const prisma_1 = require("../prisma");
const dates_1 = require("../utils/dates");
const tiers_1 = require("../utils/tiers");
const errors_1 = require("../utils/errors");
function getClient(client) {
    return client ?? prisma_1.prisma;
}
const TIER_NORMALIZER = {
    basic: 'BASIC',
    plus: 'PLUS',
    premium: 'PREMIUM',
};
const STATUS_NORMALIZER = {
    active: 'ACTIVE',
    paused: 'PAUSED',
    cancelled: 'CANCELLED',
};
function normalizeTier(tier) {
    const key = tier.toLowerCase();
    return TIER_NORMALIZER[key] ?? 'BASIC';
}
function normalizeStatus(status) {
    const key = status.toLowerCase();
    return STATUS_NORMALIZER[key] ?? 'ACTIVE';
}
function mapMemberRecord(member) {
    return {
        ...member,
        tier: normalizeTier(member.tier),
        status: normalizeStatus(member.status),
    };
}
async function getMemberByCard(cardToken) {
    const memberWithLoans = await prisma_1.prisma.member.findUnique({
        where: { cardToken },
        include: {
            loans: {
                where: { returnedAt: null },
                select: {
                    id: true,
                    thumbnailUrl: true,
                },
            },
        },
    });
    if (!memberWithLoans) {
        throw new errors_1.AppError(404, 'Member not found');
    }
    const baseMember = mapMemberRecord(memberWithLoans);
    const { loans } = memberWithLoans;
    const normalizedMember = {
        ...baseMember,
        loans,
    };
    const allowances = (0, tiers_1.getTierConfig)(normalizedMember.tier);
    const activeLoans = loans.map((loan) => ({
        id: loan.id,
        thumbnailUrl: loan.thumbnailUrl,
    }));
    return { member: normalizedMember, allowances, activeLoans };
}
async function resetCountersIfNewCycle(member, client) {
    const now = new Date();
    if (now < member.cycleEnd) {
        return member;
    }
    const db = getClient(client);
    const newCycleStart = member.cycleEnd;
    const newCycleEnd = (0, dates_1.addMonths)(newCycleStart, 1);
    const updated = await db.member.update({
        where: { id: member.id },
        data: {
            cycleStart: newCycleStart,
            cycleEnd: newCycleEnd,
            itemsUsed: 0,
            swapsUsed: 0,
        },
    });
    return mapMemberRecord(updated);
}
function validateMemberActive(member) {
    if (member.status !== 'ACTIVE') {
        if (member.status === 'PAUSED') {
            throw new errors_1.AppError(400, 'Subscription is paused - no new loans allowed');
        }
        throw new errors_1.AppError(400, 'Subscription inactive');
    }
}
function validateMemberCanCheckout(member) {
    validateMemberActive(member);
    const allowances = (0, tiers_1.getTierConfig)(member.tier);
    if (member.itemsUsed >= allowances.itemsPerMonth) {
        const remaining = allowances.itemsPerMonth - member.itemsUsed;
        throw new errors_1.AppError(400, `${member.tier} plan: ${remaining} of ${allowances.itemsPerMonth} items remaining this month`);
    }
    if (member.itemsOut >= allowances.maxItemsOut) {
        throw new errors_1.AppError(400, `${member.tier} plan: Maximum ${allowances.maxItemsOut} items allowed out. Return items to continue.`);
    }
}
function validateSwapAllowance(member) {
    validateMemberActive(member);
    const allowances = (0, tiers_1.getTierConfig)(member.tier);
    if (member.swapsUsed >= allowances.swaps) {
        const remaining = allowances.swaps - member.swapsUsed;
        throw new errors_1.AppError(400, `${member.tier} plan: ${remaining} of ${allowances.swaps} swaps remaining this month`);
    }
    if (member.itemsUsed >= allowances.itemsPerMonth) {
        throw new errors_1.AppError(400, `${member.tier} plan: Monthly item limit reached`);
    }
    if (member.itemsOut <= 0) {
        throw new errors_1.AppError(400, 'No items out to swap');
    }
}
async function getMemberById(memberId, client) {
    const db = getClient(client);
    const member = await db.member.findUnique({ where: { id: memberId } });
    if (!member) {
        throw new errors_1.AppError(404, 'Member not found');
    }
    return mapMemberRecord(member);
}
