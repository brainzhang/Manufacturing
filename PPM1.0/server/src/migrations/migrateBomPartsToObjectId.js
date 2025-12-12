const mongoose = require('mongoose');
const BOM = require('../models/BOM');
const Part = require('../models/Part');

/**
 * Migration script to convert BOM parts from part_id strings to ObjectId references
 * This script should be run once after updating the BOM model
 */
async function migrateBomPartsToObjectId() {
  try {
    console.log('Starting BOM parts migration...');
    
    // Get all BOMs
    const boms = await BOM.find({});
    console.log(`Found ${boms.length} BOMs to process`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const bom of boms) {
      try {
        // Check if parts need migration
        if (!bom.parts || bom.parts.length === 0) {
          console.log(`Skipping BOM ${bom.bom_id} - no parts`);
          continue;
        }
        
        let needsUpdate = false;
        const updatedParts = [];
        
        for (const part of bom.parts) {
          // Check if part_id is already an ObjectId
          if (mongoose.Types.ObjectId.isValid(part.part_id) && 
              part.part_id.toString().length === 24) {
            // Already an ObjectId, keep as is
            updatedParts.push(part);
          } else {
            // Need to convert string part_id to ObjectId
            needsUpdate = true;
            
            // Find the Part by part_id (string field in Part model)
            const partDoc = await Part.findOne({ part_id: part.part_id });
            
            if (partDoc) {
              updatedParts.push({
                part_id: partDoc._id, // Use ObjectId
                quantity: part.quantity,
                position: part.position
              });
              console.log(`Converted part ${part.part_id} to ObjectId ${partDoc._id}`);
            } else {
              console.warn(`Could not find Part with part_id: ${part.part_id}`);
              // Keep original if part not found
              updatedParts.push(part);
            }
          }
        }
        
        // Update BOM if changes were made
        if (needsUpdate) {
          await BOM.findByIdAndUpdate(bom._id, { parts: updatedParts });
          updatedCount++;
          console.log(`Updated BOM ${bom.bom_id}`);
        }
        
      } catch (error) {
        errorCount++;
        console.error(`Error processing BOM ${bom.bom_id}:`, error.message);
      }
    }
    
    console.log('\nMigration complete!');
    console.log(`Successfully updated: ${updatedCount} BOMs`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Total processed: ${boms.length} BOMs`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const config = require('../config/database');
  
  mongoose.connect(config.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('Connected to MongoDB');
    return migrateBomPartsToObjectId();
  })
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration error:', error);
    process.exit(1);
  });
}

module.exports = migrateBomPartsToObjectId;
