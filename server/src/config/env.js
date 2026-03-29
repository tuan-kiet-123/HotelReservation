const path = require("path");
const dotenv = require("dotenv");

const rootEnvPath = path.resolve(__dirname, "../../../.env");
const serverEnvPath = path.resolve(__dirname, "../../.env");

dotenv.config({ path: rootEnvPath });
dotenv.config({ path: serverEnvPath, override: false });

function getEnv(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === "") {
    return fallback;
  }
  return value;
}

module.exports = {
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: Number(getEnv("PORT", 5000)),
  MONGODB_URI: getEnv("MONGODB_URI", ""),
  MYSQL_HOST: getEnv("MYSQL_HOST", ""),
  MYSQL_PORT: Number(getEnv("MYSQL_PORT", 3306)),
  MYSQL_USER: getEnv("MYSQL_USER", ""),
  MYSQL_PASSWORD: getEnv("MYSQL_PASSWORD", ""),
  MYSQL_DATABASE: getEnv("MYSQL_DATABASE", ""),
  MYSQL_SSL: getEnv("MYSQL_SSL", "true")
};
