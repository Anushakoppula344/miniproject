const mongoose = require('mongoose');
const dotenv = require('dotenv');
const JobRole = require('./models/JobRole');

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

// Update all job role statuses based on registration deadline
async function updateAllJobStatuses() {
  try {
    console.log('🔄 Starting bulk status update...');
    
    const jobRoles = await JobRole.find({});
    let updatedCount = 0;
    
    for (let jobRole of jobRoles) {
      const today = new Date();
      const lastDate = new Date(jobRole.registrationLastDate);
      const newStatus = lastDate >= today ? 'Active' : 'Inactive';
      
      if (jobRole.status !== newStatus) {
        jobRole.status = newStatus;
        await jobRole.save();
        updatedCount++;
        console.log(`📝 Updated "${jobRole.title}" status to ${newStatus}`);
      }
    }
    
    console.log(`✅ Status update completed. ${updatedCount} job roles updated.`);
    
  } catch (error) {
    console.error('❌ Error updating job role statuses:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the function
updateAllJobStatuses();
