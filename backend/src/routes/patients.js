const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const ctrl = require('../controllers/patientController');

const router = express.Router();

router.get('/', asyncHandler(ctrl.list));
router.get('/:id', asyncHandler(ctrl.get));
router.post('/', asyncHandler(ctrl.create));
router.put('/:id', asyncHandler(ctrl.update));
router.delete('/:id', asyncHandler(ctrl.remove));

module.exports = router;
