const userService = require("../../services/mongo/userService");
const { success } = require("../../utils/apiResponse");

async function getUsers(req, res, next) {
  try {
    const limit = req.query.limit;
    const users = await userService.getUsers(limit);
    return success(res, users, "Get users successfully");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getUsers
};
