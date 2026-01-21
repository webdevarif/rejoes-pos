"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const config_1 = require("./config");
const members_routes_1 = __importDefault(require("./routes/members.routes"));
const loans_routes_1 = __importDefault(require("./routes/loans.routes"));
const uploads_routes_1 = __importDefault(require("./routes/uploads.routes"));
const webhooks_routes_1 = __importDefault(require("./routes/webhooks.routes"));
const idempotency_1 = require("./middlewares/idempotency");
const errorHandler_1 = require("./middlewares/errorHandler");
async function createApp() {
    const app = (0, express_1.default)();
    app.use((0, helmet_1.default)());
    app.use((0, morgan_1.default)(config_1.config.env === 'production' ? 'combined' : 'dev'));
    app.use(express_1.default.json({
        verify: (req, _res, buf) => {
            if (buf?.length) {
                req.rawBody = Buffer.from(buf);
            }
        },
    }));
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use('/uploads', express_1.default.static(path_1.default.resolve(process.cwd(), 'uploads')));
    app.use(idempotency_1.idempotencyMiddleware);
    app.use('/api/members', members_routes_1.default);
    app.use('/api/loans', loans_routes_1.default);
    app.use('/api/uploads', uploads_routes_1.default);
    app.use('/api/webhooks', webhooks_routes_1.default);
    app.use(errorHandler_1.errorHandler);
    return app;
}
