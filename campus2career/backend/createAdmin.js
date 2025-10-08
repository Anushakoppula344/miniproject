const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mock-interview', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Admin credentials
const adminCredentials = {
  name: 'Admin User',
  email: 'admin@campus2career.com',
  password: 'admin123',
  role: 'other',
  userType: 'admin',
  interviewType: 'technical',
  yearsOfExperience: 5,
  skills: ['Management', 'Leadership', 'System Administration'],
  isActive: true
};

// Create admin user function
async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user...');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminCredentials.email });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 User Type:', existingAdmin.userType);
      console.log('🔑 Password: admin123');
      return;
    }

    // Create new admin user
    const adminUser = new User(adminCredentials);
    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 Password: admin123');
    console.log('👤 User Type:', adminUser.userType);
    console.log('🆔 User ID:', adminUser._id);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the function
createAdminUser();
