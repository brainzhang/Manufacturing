const mongoose = require('mongoose');
const User = require('./server/src/models/User');

// Set up MongoDB connection
const connectDB = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ppm3';
    const uriWithoutAuth = mongoUri.replace(/\/\/([^:]+:[^@]+@)/, '//');
    
    await mongoose.connect(uriWithoutAuth, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      authSource: null,
    });
    
    console.log('MongoDB connected successfully');
    
    // Fetch all users
    const users = await User.find({});
    console.log('\nUsers in database:');
    users.forEach(user => {
      console.log(`- ID: ${user._id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password Hash: ${user.password}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Status: ${user.status}`);
      console.log('----------------------------');
    });
    
    // Check if admin user exists
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    if (adminUser) {
      console.log('\nAdmin user found with email: admin@example.com');
      
      // Test password comparison
      const isPasswordCorrect = await adminUser.comparePassword('password123');
      console.log(`Password 'password123' is correct: ${isPasswordCorrect}`);
    } else {
      console.log('\nAdmin user with email admin@example.com not found');
    }
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
};

// Run the script
connectDB();