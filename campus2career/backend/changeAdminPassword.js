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

// Get new password from command line argument or use default
const newPassword = process.argv[2] || 'Campus2Career@2024#Secure';

// Update admin password function
async function updateAdminPassword() {
  try {
    console.log('🔐 Updating admin password...');
    console.log('🔑 New password will be:', newPassword);

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

    console.log('\n📝 Usage Instructions:');
    console.log('• To change password again, run: node changeAdminPassword.js "YourNewPassword"');
    console.log('• Or edit the script and change the default password');

  } catch (error) {
    console.error('❌ Error updating admin password:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the function
updateAdminPassword();
