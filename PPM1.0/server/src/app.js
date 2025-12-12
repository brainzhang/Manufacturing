const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const winston = require('winston');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware - 允许所有来源（用于外网部署）
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Database connection - only connect if not in test environment
if (process.env.NODE_ENV !== 'test') {
  const connectDB = require('./config/database');
  connectDB();
}

// Routes
const authRoutes = require('./routes/authRoutes');
const partRoutes = require('./routes/partRoutes');
const bomRoutes = require('./routes/bomRoutes');
const productRoutes = require('./routes/productRoutes');
const pnMapRoutes = require('./routes/pnMapRoutes');
const alignmentRoutes = require('./routes/alignmentRoutes');
const dashboardRoutes = require('./routes/dashboard');
const importRoutes = require('./routes/importRoutes');
const templateRoutes = require('./routes/templateRoutes');
const pushRoutes = require('./routes/pushRoutes');

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'PPM 3.0 API Server', 
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api_docs: '/api/docs',
      auth: '/api/v1/auth',
      parts: '/api/v1/parts',
      boms: '/api/v1/boms',
      pnMaps: '/api/v1/pn-maps',
      alignments: '/api/v1/alignments',
      dashboard: '/api/v1/dashboard'
    }
  });
});

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
  res.status(200).json({
    title: 'PPM 3.0 API Documentation',
    version: '1.0.0',
    description: 'Product Portfolio Management System API',
    base_url: 'http://localhost:3000',
    endpoints: [
      {
        method: 'GET',
        path: '/',
        description: 'API server status and available endpoints'
      },
      {
        method: 'GET',
        path: '/health',
        description: 'Health check endpoint'
      },
      {
        method: 'GET',
        path: '/api/v1/dashboard',
        description: 'Get dashboard data and statistics'
      },
      {
        method: 'GET',
        path: '/api/v1/parts',
        description: 'Get all parts or search parts'
      },
      {
        method: 'POST',
        path: '/api/v1/parts',
        description: 'Create a new part'
      },
      {
        method: 'GET',
        path: '/api/v1/boms',
        description: 'Get all BOMs or search BOMs'
      },
      {
        method: 'POST',
        path: '/api/v1/boms',
        description: 'Create a new BOM'
      }
    ]
  });
});

// Use routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/parts', partRoutes);
app.use('/api/v1/boms', bomRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/pn-maps', pnMapRoutes);
app.use('/api/v1/alignments', alignmentRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/import', importRoutes);
app.use('/api/v1/templates', templateRoutes);
app.use('/api/v1/push', pushRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'PPM 3.0 API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server - only start if not in test environment
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3001;
  console.log('PORT environment variable:', process.env.PORT);
  console.log('Using port:', PORT);
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server is running on port ${PORT}`);
  });
}

module.exports = app;