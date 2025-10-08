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

// New admin password - Change this to your desired password
const newPassword = 'Campus2Career@2024#Secure';

// Update admin password function
async function updateAdminPassword() {
  try {
    console.log('🔐 Updating admin password...');

    // Find the admin user
    const adminUser = await User.findOne({ 
      email: 'admin@campus2career.com',
      userType: 'admin'
    });

    if (!adminUser) {
      console.log('❌ Admin user not found');
      console.log('💡 Run createAdmin.js first to create the admin user');
      return;
    }

    console.log('👤 Found admin user:', adminUser.email);
    console.log('🔄 Updating password...');

    // Update the password
    adminUser.password = newPassword;
    await adminUser.save();

    console.log('✅ Admin password updated successfully!');
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 New Password:', newPassword);
    console.log('👤 User Type:', adminUser.userType);
    console.log('🆔 User ID:', adminUser._id);

  } catch (error) {
    console.error('❌ Error updating admin password:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the function
updateAdminPassword();
