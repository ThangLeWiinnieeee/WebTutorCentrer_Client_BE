const { Province, District } = require("./location.model");

const findAllProvinces = async () => {
  return await Province.find({}).sort({ name: 1 }).lean();
};

const findDistrictsByProvinceCode = async (provinceCode) => {
  return await District.find({ provinceCode }).sort({ name: 1 }).lean();
};

const findProvinceByCode = async (code) => {
  return await Province.findOne({ code }).lean();
};

const findDistrictByCode = async (code) => {
  return await District.findOne({ code }).lean();
};

const bulkUpsertProvinces = async (provinces) => {
  const ops = provinces.map((p) => ({
    updateOne: {
      filter: { code: p.code },
      update: { $set: p },
      upsert: true,
    },
  }));
  return await Province.bulkWrite(ops);
};

const bulkUpsertDistricts = async (districts) => {
  const ops = districts.map((d) => ({
    updateOne: {
      filter: { code: d.code },
      update: { $set: d },
      upsert: true,
    },
  }));
  return await District.bulkWrite(ops);
};

module.exports = {
  findAllProvinces,
  findDistrictsByProvinceCode,
  findProvinceByCode,
  findDistrictByCode,
  bulkUpsertProvinces,
  bulkUpsertDistricts,
};
