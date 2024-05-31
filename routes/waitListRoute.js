const express = require("express");
const router = express.Router();

const waitListController = require('../controllers/waitListController');


router.post('/onboard', waitListController.sendWaitListEmail);

module.exports = router;