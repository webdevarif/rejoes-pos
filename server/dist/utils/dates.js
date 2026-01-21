"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMonths = addMonths;
exports.isSameOrAfter = isSameOrAfter;
exports.toDate = toDate;
function addMonths(date, months) {
    const result = new Date(date);
    const desiredMonth = result.getMonth() + months;
    result.setMonth(desiredMonth);
    return result;
}
function isSameOrAfter(date, compareTo) {
    return date.getTime() >= compareTo.getTime();
}
function toDate(value) {
    return value instanceof Date ? value : new Date(value);
}
