const User = require("../../models/mongo/User");

async function getUsers(limit = 3) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 3, 20));
  return User.find()
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .select("_id FullName Email Phone")
    .lean();
}

module.exports = {
  getUsers
};
