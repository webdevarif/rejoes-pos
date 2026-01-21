"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutLoan = checkoutLoan;
exports.returnLoan = returnLoan;
exports.swapLoan = swapLoan;
exports.getActiveLoans = getActiveLoans;
const prisma_1 = require("../prisma");
const errors_1 = require("../utils/errors");
const audit_service_1 = require("./audit.service");
const member_service_1 = require("./member.service");
async function getLoanOrThrow(loanId, client) {
    const loan = await client.loan.findUnique({ where: { id: loanId } });
    if (!loan) {
        throw new errors_1.AppError(404, 'Loan not found');
    }
    return loan;
}
async function consumeLoanPhoto(uploadId, client) {
    const photo = await client.loanPhoto.findUnique({ where: { id: uploadId } });
    if (!photo) {
        throw new errors_1.AppError(400, 'Invalid upload reference');
    }
    await client.loanPhoto.delete({ where: { id: uploadId } });
    return photo;
}
async function checkoutLoan(input) {
    return prisma_1.prisma.$transaction(async (tx) => {
        let member = await (0, member_service_1.getMemberById)(input.memberId, tx);
        member = await (0, member_service_1.resetCountersIfNewCycle)(member, tx);
        (0, member_service_1.validateMemberCanCheckout)(member);
        const photo = await consumeLoanPhoto(input.uploadId, tx);
        // Calculate due date (30 days from checkout)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        const loan = await tx.loan.create({
            data: {
                memberId: member.id,
                storeLocation: input.storeLocation,
                photoUrl: photo.photoUrl,
                thumbnailUrl: photo.thumbnailUrl,
                dueDate,
            },
        });
        await tx.member.update({
            where: { id: member.id },
            data: {
                itemsUsed: { increment: 1 },
                itemsOut: { increment: 1 },
            },
        });
        await (0, audit_service_1.logEvent)(member.id, 'loan_checkout', { loanId: loan.id }, tx);
        return loan;
    });
}
async function returnLoan(input) {
    return prisma_1.prisma.$transaction(async (tx) => {
        let member = await (0, member_service_1.getMemberById)(input.memberId, tx);
        member = await (0, member_service_1.resetCountersIfNewCycle)(member, tx);
        const loan = await getLoanOrThrow(input.loanId, tx);
        if (loan.memberId !== member.id) {
            throw new errors_1.AppError(400, 'Loan does not belong to member');
        }
        if (loan.returnedAt) {
            throw new errors_1.AppError(400, 'Loan already returned');
        }
        const updatedLoan = await tx.loan.update({
            where: { id: loan.id },
            data: { returnedAt: new Date() },
        });
        await tx.member.update({
            where: { id: member.id },
            data: {
                itemsOut: { decrement: 1 },
            },
        });
        await (0, audit_service_1.logEvent)(member.id, 'loan_return', { loanId: loan.id }, tx);
        return updatedLoan;
    });
}
async function swapLoan(input) {
    return prisma_1.prisma.$transaction(async (tx) => {
        let member = await (0, member_service_1.getMemberById)(input.memberId, tx);
        member = await (0, member_service_1.resetCountersIfNewCycle)(member, tx);
        (0, member_service_1.validateSwapAllowance)(member);
        const loan = await getLoanOrThrow(input.loanId, tx);
        if (loan.memberId !== member.id) {
            throw new errors_1.AppError(400, 'Loan does not belong to member');
        }
        if (loan.returnedAt) {
            throw new errors_1.AppError(400, 'Loan already returned');
        }
        const now = new Date();
        const returnedLoan = await tx.loan.update({
            where: { id: loan.id },
            data: { returnedAt: now },
        });
        const photo = await consumeLoanPhoto(input.uploadId, tx);
        // Calculate due date for new loan (30 days from swap)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        const newLoan = await tx.loan.create({
            data: {
                memberId: member.id,
                storeLocation: input.storeLocation,
                photoUrl: photo.photoUrl,
                thumbnailUrl: photo.thumbnailUrl,
                checkoutAt: now,
                dueDate,
            },
        });
        await tx.member.update({
            where: { id: member.id },
            data: {
                swapsUsed: { increment: 1 },
                itemsUsed: { increment: 1 },
            },
        });
        await (0, audit_service_1.logEvent)(member.id, 'loan_swap', { oldLoanId: loan.id, newLoanId: newLoan.id }, tx);
        return { returnedLoan, newLoan };
    });
}
async function getActiveLoans(memberId) {
    return prisma_1.prisma.loan.findMany({ where: { memberId, returnedAt: null }, orderBy: { checkoutAt: 'desc' } });
}
