"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./types");
const config_1 = require("./config");
const app_1 = require("./app");
async function bootstrap() {
    const app = await (0, app_1.createApp)();
    app.listen(config_1.config.port, () => {
        // eslint-disable-next-line no-console
        console.log(`ReJoEs backend listening on port ${config_1.config.port}`);
    });
}
bootstrap().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', error);
    process.exit(1);
});
