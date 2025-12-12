const express = require('express');
const { 
  getAllAlignments, 
  getAlignmentById, 
  performAlignment, 
  updateAlignment 
} = require('../controllers/alignmentController');

const router = express.Router();

router.get('/', getAllAlignments);
router.get('/:id', getAlignmentById);
router.post('/', performAlignment);
router.put('/:id', updateAlignment);

module.exports = router;