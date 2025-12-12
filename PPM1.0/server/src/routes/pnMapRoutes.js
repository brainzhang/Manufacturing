const express = require('express');
const { 
  getAllPNMaps, 
  getPNMapById, 
  createPNMap, 
  updatePNMap, 
  deletePNMap 
} = require('../controllers/pnMapController');

const router = express.Router();

router.get('/', getAllPNMaps);
router.get('/:id', getPNMapById);
router.post('/', createPNMap);
router.put('/:id', updatePNMap);
router.delete('/:id', deletePNMap);

module.exports = router;