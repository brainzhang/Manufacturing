const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Set Mongoose options to suppress warnings
mongoose.set('strictQuery', false); // Suppress the strictQuery deprecation warning

// Database connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  authSource: null,
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Remove username and password from URI if they exist
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ppm3';
    const uriWithoutAuth = mongoUri.replace(/\/\/([^:]+:[^@]+@)/, '//');
    
    const conn = await mongoose.connect(uriWithoutAuth, options);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  logger.info('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  logger.error(`Mongoose connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  logger.info('Mongoose disconnected');
});

// Close connection when process ends
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('Mongoose disconnected through app termination');
  process.exit(0);
});

module.exports = connectDB;