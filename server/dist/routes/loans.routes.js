"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const loan_service_1 = require("../services/loan.service");
const router = (0, express_1.Router)();
router.post('/checkout', async (req, res, next) => {
    try {
        const { memberId, storeLocation, uploadId } = req.body;
        if (!memberId || !storeLocation || !uploadId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const loan = await (0, loan_service_1.checkoutLoan)({ memberId, storeLocation, uploadId });
        return res.status(201).json(loan);
    }
    catch (error) {
        return next(error);
    }
});
router.post('/return', async (req, res, next) => {
    try {
        const { memberId, loanId } = req.body;
        if (!memberId || !loanId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const loan = await (0, loan_service_1.returnLoan)({ memberId, loanId });
        return res.json(loan);
    }
    catch (error) {
        return next(error);
    }
});
router.post('/swap', async (req, res, next) => {
    try {
        const { memberId, loanId, storeLocation, uploadId } = req.body;
        if (!memberId || !loanId || !storeLocation || !uploadId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const result = await (0, loan_service_1.swapLoan)({ memberId, loanId, storeLocation, uploadId });
        return res.json(result);
    }
    catch (error) {
        return next(error);
    }
});
router.get('/active/:memberId', async (req, res, next) => {
    try {
        const { memberId } = req.params;
        if (!memberId) {
            return res.status(400).json({ message: 'Missing memberId' });
        }
        const loans = await (0, loan_service_1.getActiveLoans)(memberId);
        return res.json(loans);
    }
    catch (error) {
        return next(error);
    }
});
exports.default = router;
