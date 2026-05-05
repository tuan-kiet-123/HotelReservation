require("dotenv").config({ path: __dirname + "/.env" });
const searchService = require('./src/services/searchService');

async function run() {
    try {
        console.log("Testing getAvailableRoomsAggr...");
        const result = await searchService.getAvailableRoomsAggr(
            '2026-05-05T00:00:00.000Z',
            '2026-05-06T00:00:00.000Z',
            999999999,
            'Standard'
        );
        console.log("Result:", result);
    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit();
    }
}

run();
