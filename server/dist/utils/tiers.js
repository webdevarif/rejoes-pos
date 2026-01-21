"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTierConfig = exports.tierConfig = void 0;
exports.tierConfig = {
    BASIC: {
        itemsPerMonth: 1,
        swaps: 0,
        maxItemsOut: 1,
    },
    PLUS: {
        itemsPerMonth: 5,
        swaps: 2,
        maxItemsOut: 2,
    },
    PREMIUM: {
        itemsPerMonth: 10,
        swaps: 5,
        maxItemsOut: 4,
    },
};
const getTierConfig = (tier) => exports.tierConfig[tier];
exports.getTierConfig = getTierConfig;
