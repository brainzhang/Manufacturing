const express = require('express');
const { 
  getAllBOMs, 
  getBOMById, 
  createBOM, 
  updateBOM, 
  deleteBOM,
  deleteBOMs,
  performAlignment
} = require('../controllers/bomController');

const router = express.Router();

router.get('/', getAllBOMs);
router.get('/:id', getBOMById);
router.post('/', createBOM);
router.put('/:id', updateBOM);
router.delete('/:id', deleteBOM);
router.delete('/', deleteBOMs);
router.post('/:id/align', performAlignment);

module.exports = router;