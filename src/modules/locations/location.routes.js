const express = require("express");
const router = express.Router();

const locationController = require("./location.controller");

router.get("/provinces", locationController.getProvinces);
router.get("/provinces/:provinceCode/districts", locationController.getDistricts);

module.exports = router;
