const Part = require('../models/Part');
const BOM = require('../models/BOM');
const PNMap = require('../models/PNMap');
const Alignment = require('../models/Alignment');

// @desc    Get dashboard data
// @route   GET /api/v1/dashboard
// @access  Public
exports.getDashboardData = async (req, res, next) => {
  try {
    // Get counts for each model
    const partsCount = await Part.countDocuments();
    const bomsCount = await BOM.countDocuments();
    const pnMapsCount = await PNMap.countDocuments();
    const alignmentsCount = await Alignment.countDocuments();
    
    // Get recent alignments
    const recentAlignments = await Alignment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('bom_id pn_id');
    
    // Get alignment status distribution
    const alignmentStatusDistribution = await Alignment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get PN map status distribution
    const pnMapStatusDistribution = await PNMap.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        counts: {
          parts: partsCount,
          boms: bomsCount,
          pnMaps: pnMapsCount,
          alignments: alignmentsCount
        },
        recentAlignments,
        alignmentStatusDistribution,
        pnMapStatusDistribution
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};