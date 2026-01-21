"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const prisma_1 = require("../prisma");
const image_service_1 = require("../services/image.service");
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1
    }
});
const router = (0, express_1.Router)();
router.post('/loan-photo', upload.single('photo'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Photo file is required' });
        }
        const original = await (0, image_service_1.saveOriginalImage)(req.file);
        const thumbnail = await (0, image_service_1.generateThumbnail)(req.file);
        const record = await prisma_1.prisma.loanPhoto.create({
            data: {
                photoUrl: original.url,
                thumbnailUrl: thumbnail.url,
            },
        });
        return res.status(201).json({
            uploadId: record.id,
            photoUrl: record.photoUrl,
            thumbnailUrl: record.thumbnailUrl,
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.default = router;
