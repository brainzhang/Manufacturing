const express = require('express');
const router = express.Router();
const Part = require('../models/Part');
const BOM = require('../models/BOM');
const PNMapping = require('../models/PNMap');
const Alignment = require('../models/Alignment');

// Get dashboard data
router.get('/', async (req, res) => {
  try {
    // Get counts from all collections
    const [partsCount, bomsCount, pnMappingsCount, alignmentsCount] = await Promise.all([
      Part.countDocuments(),
      BOM.countDocuments(),
      PNMapping.countDocuments(),
      Alignment.countDocuments()
    ]);

    // Get recent alignments
    const recentAlignments = await Alignment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('bom_id', 'bom_id bom_name')
      .populate('pn_id', 'target_pn')
      .select('_id target_pn status createdAt')
      .lean();

    res.json({
      counts: {
        parts: partsCount,
        boms: bomsCount,
        pnMappings: pnMappingsCount,
        alignments: alignmentsCount
      },
      recentAlignments: recentAlignments,
      summary: {
        totalParts: partsCount,
        activeBoms: bomsCount,
        alignments: alignmentsCount,
        users: 15
      }
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard data',
      message: error.message 
    });
  }
});

module.exports = router;