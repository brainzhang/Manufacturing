const express = require('express');
const { 
  getAllParts, 
  getPartById, 
  createPart, 
  updatePart, 
  deletePart,
  deleteParts,
  deleteAllParts 
} = require('../controllers/partController');

const router = express.Router();

router.get('/', getAllParts);
router.get('/:id', getPartById);
router.post('/', createPart);
router.put('/:id', updatePart);
router.delete('/:id', deletePart);
router.post('/batch-delete', deleteParts);
router.delete('/all', deleteAllParts);

module.exports = router;