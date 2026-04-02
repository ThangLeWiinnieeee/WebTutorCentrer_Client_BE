const User = require("./user.model");

const findByEmail = async (email, includePassword = false) => {
  const query = User.findOne({ email });
  if (includePassword) query.select("+password");
  return await query;
};

const findById = async (id) => {
  return await User.findById(id);
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

const verifyUser = async (userId) => {
  return await User.findByIdAndUpdate(userId, { isVerified: true }, { new: true });
};

const updatePassword = async (userId, hashedPassword) => {
  return await User.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true });
};

module.exports = {
  findByEmail,
  findById,
  create,
  updateRefreshToken,
  findByRefreshToken,
  verifyUser,
  updatePassword,
};
