const Tutor = require("../models/tutor.model");
const { TUTOR_STATUS } = require("../constants/tutor");

const POPULATE_USER = "fullName email gender dateOfBirth avatar phone";

const findByUserId = async (userId) => {
  return await Tutor.findOne({ userId });
};

const findById = async (id) => {
  return await Tutor.findById(id).populate("userId", POPULATE_USER);
};

const create = async (tutorData) => {
  const tutor = new Tutor(tutorData);
  return await tutor.save();
};

const update = async (tutorId, updateData) => {
  return await Tutor.findByIdAndUpdate(tutorId, updateData, { new: true, runValidators: true })
    .populate("userId", POPULATE_USER);
};

const updateByUserId = async (userId, updateData) => {
  return await Tutor.findOneAndUpdate({ userId }, updateData, { new: true, runValidators: true });
};

const findAllPending = async () => {
  return await Tutor.find({ status: TUTOR_STATUS.PENDING })
    .populate("userId", POPULATE_USER)
    .sort({ createdAt: -1 });
};

const countByStatus = async (status) => {
  return await Tutor.countDocuments({ status });
};

const findAll = async () => {
  return await Tutor.find({})
    .populate("userId", POPULATE_USER)
    .sort({ createdAt: -1 });
};

// Lấy danh sách tất cả gia sư đã approved, sắp xếp theo totalClassesAccepted (giảm dần)
const findAllApproved = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const tutors = await Tutor.find({ status: TUTOR_STATUS.APPROVED })
    .populate("userId", POPULATE_USER)
    .sort({ totalClassesAccepted: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await Tutor.countDocuments({ status: TUTOR_STATUS.APPROVED });
  
  return { tutors, total, page, limit };
};

// Lấy top gia sư nổi bật tháng hiện tại (sắp xếp theo classesAcceptedThisMonth)
const findTopTutors = async (limit = 10) => {
  return await Tutor.find({ status: TUTOR_STATUS.APPROVED })
    .populate("userId", POPULATE_USER)
    .sort({ classesAcceptedThisMonth: -1, totalClassesAccepted: -1 })
    .limit(limit);
};

// Lấy gia sư mới (approved trong N ngày gần đây)
const findNewTutors = async (days = 7, limit = 10) => {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);
  
  return await Tutor.find({
    status: TUTOR_STATUS.APPROVED,
    updatedAt: { $gte: dateThreshold },
  })
    .populate("userId", POPULATE_USER)
    .sort({ updatedAt: -1 })
    .limit(limit);
};

// Tìm kiếm & lọc gia sư
const searchTutors = async (filters = {}, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const query = { status: TUTOR_STATUS.APPROVED };

  // Lọc theo subject
  if (filters.subject) {
    query.subjects = filters.subject;
  }

  // Lọc theo occupationStatus
  if (filters.occupationStatus) {
    query.occupationStatus = filters.occupationStatus;
  }

  // Lọc theo gender (từ User)
  if (filters.gender) {
    // Sẽ xử lý ở service layer vì cần populate
  }

  // Lọc theo tỉnh/thành (teachingAreas.province)
  if (filters.province) {
    query["teachingAreas.province"] = filters.province;
  }

  // Lọc theo quận/huyện (teachingAreas.districts)
  if (filters.district) {
    query["teachingAreas.districts"] = filters.district;
  }

  // Nếu có filter gender, cần populate user và filter ở application layer
  let tutors = await Tutor.find(query)
    .populate("userId", POPULATE_USER)
    .sort({ totalClassesAccepted: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Filter theo gender nếu có (vì gender nằm ở User model)
  if (filters.gender) {
    tutors = tutors.filter((t) => t.userId?.gender === filters.gender);
  }

  const total = await Tutor.countDocuments(query);

  return { tutors, total, page, limit };
};

module.exports = {
  findByUserId,
  findById,
  create,
  update,
  updateByUserId,
  findAllPending,
  countByStatus,
  findAll,
  findAllApproved,
  findTopTutors,
  findNewTutors,
  searchTutors,
};
