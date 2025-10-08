const mongoose = require('mongoose');
const JobRole = require('./models/JobRole');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://anjalikoppulaa:anjalikoppulaa@cluster0.8qjqj.mongodb.net/campus2career?retryWrites=true&w=majority';

async function createHexclusterJobRoles() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Create job roles for Hexcluster
    const jobRoles = [
      {
        title: 'Full Stack Developer',
        company: 'Hexcluster',
        level: 'Mid-Level',
        type: 'Full-time',
        location: 'Hyderabad, India',
        description: 'Develop and maintain web applications using modern technologies',
        requirements: ['3+ years experience', 'Bachelor\'s degree in Computer Science', 'Strong problem-solving skills'],
        skills: ['React', 'Node.js', 'MongoDB', 'JavaScript', 'TypeScript'],
        salary: { min: 800000, max: 1200000, currency: 'INR' },
        registrationLastDate: new Date('2025-12-31T00:00:00.000Z'),
        status: 'Active'
      },
      {
        title: 'Data Scientist',
        company: 'Hexcluster',
        level: 'Senior',
        type: 'Full-time',
        location: 'Hyderabad, India',
        description: 'Analyze complex data sets and build machine learning models',
        requirements: ['5+ years experience', 'Master\'s degree in Data Science', 'Experience with ML frameworks'],
        skills: ['Python', 'Machine Learning', 'TensorFlow', 'Pandas', 'SQL'],
        salary: { min: 1000000, max: 1500000, currency: 'INR' },
        registrationLastDate: new Date('2025-11-30T00:00:00.000Z'),
        status: 'Active'
      },
      {
        title: 'UI/UX Designer',
        company: 'Hexcluster',
        level: 'Entry-Level',
        type: 'Full-time',
        location: 'Hyderabad, India',
        description: 'Design intuitive and engaging user interfaces',
        requirements: ['1+ years experience', 'Bachelor\'s degree in Design', 'Portfolio required'],
        skills: ['Figma', 'Adobe Creative Suite', 'User Research', 'Prototyping', 'HTML/CSS'],
        salary: { min: 500000, max: 800000, currency: 'INR' },
        registrationLastDate: new Date('2025-12-15T00:00:00.000Z'),
        status: 'Active'
      }
    ];

    // Clear existing Hexcluster job roles
    await JobRole.deleteMany({ company: 'Hexcluster' });
    console.log('Cleared existing Hexcluster job roles');

    // Create new job roles
    const createdJobs = await JobRole.insertMany(jobRoles);
    console.log(`Created ${createdJobs.length} job roles for Hexcluster:`);
    createdJobs.forEach(job => {
      console.log(`- ${job.title} (${job.level})`);
    });

    // Verify the job roles were created
    const hexclusterJobs = await JobRole.find({ company: 'Hexcluster' });
    console.log(`\nTotal Hexcluster job roles in database: ${hexclusterJobs.length}`);

  } catch (error) {
    console.error('Error creating job roles:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createHexclusterJobRoles();
