const express = require('express');
const router = express.Router();
const controller = require('../controllers/lineArtController');

router.get('/daily', controller.getDaily);
router.put('/daily', controller.upsertDaily);
router.get('/list', controller.list);

module.exports = router;
