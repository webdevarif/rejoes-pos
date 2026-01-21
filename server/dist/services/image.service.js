"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveOriginalImage = saveOriginalImage;
exports.generateThumbnail = generateThumbnail;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const sharp_1 = __importDefault(require("sharp"));
const uuid_1 = require("uuid");
const config_1 = require("../config");
async function ensureUploadDirs() {
    await Promise.all(Object.values(config_1.config.uploadDirs).map((dir) => promises_1.default.mkdir(dir, { recursive: true })));
}
function buildFilename(suffix) {
    return `${(0, uuid_1.v4)()}-${suffix}.jpg`;
}
async function saveOriginalImage(file) {
    if (!file?.buffer) {
        throw new Error('Invalid file buffer');
    }
    await ensureUploadDirs();
    const filename = buildFilename('original');
    const fullPath = path_1.default.join(config_1.config.uploadDirs.originals, filename);
    await (0, sharp_1.default)(file.buffer).jpeg({ quality: 85 }).toFile(fullPath);
    return {
        filename,
        path: fullPath,
        url: `/uploads/originals/${filename}`,
    };
}
async function generateThumbnail(file) {
    if (!file?.buffer) {
        throw new Error('Invalid file buffer');
    }
    await ensureUploadDirs();
    const filename = buildFilename('thumb');
    const fullPath = path_1.default.join(config_1.config.uploadDirs.thumbnails, filename);
    await (0, sharp_1.default)(file.buffer)
        .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 70 })
        .toFile(fullPath);
    return {
        filename,
        path: fullPath,
        url: `/uploads/thumbnails/${filename}`,
    };
}
