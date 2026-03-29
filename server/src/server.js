const app = require("./app");
const env = require("./config/env");
const { connectMongo } = require("./config/mongo");
const { checkMySqlConnection } = require("./config/mysql");

async function bootstrap() {
  try {
    await connectMongo();
    await checkMySqlConnection();

    app.listen(env.PORT, () => {
      console.log(`Server listening on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

bootstrap();
