"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const member_service_1 = require("../services/member.service");
const router = (0, express_1.Router)();
router.get('/by-card/:cardToken', async (req, res, next) => {
    try {
        const { cardToken } = req.params;
        const payload = await (0, member_service_1.getMemberByCard)(cardToken);
        res.json({
            member: payload.member,
            allowances: payload.allowances,
            activeLoans: payload.activeLoans,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
