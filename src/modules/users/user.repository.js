const User = require("./user.model");

const findByEmail = async (email, includePassword = false) => {
  const query = User.findOne({ email });
  if (includePassword) query.select("+password");
  return await query;
};

const findById = async (id, includeRefreshToken = false) => {
  const query = User.findById(id);
  if (includeRefreshToken) query.select("+refreshToken");
  return await query;
};

const create = async (userData) => {
  const user = new User(userData);
  return await user.save();
};

const updateRefreshToken = async (userId, refreshToken) => {
  return await User.findByIdAndUpdate(userId, { refreshToken }, { new: true });
};

const findByRefreshToken = async (refreshToken) => {
  return await User.findOne({ refreshToken }).select("+refreshToken");
};

module.exports = {
  findByEmail,
  findById,
  create,
  updateRefreshToken,
  findByRefreshToken,
};
