const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Company = require('./models/Company');
const JobRole = require('./models/JobRole');
const Workflow = require('./models/Workflow');

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

// Sample data
const sampleCompanies = [
  {
    name: 'Google',
    industry: 'Technology',
    location: 'Mountain View, CA',
    website: 'https://google.com',
    companySize: '1000+',
    description: 'Leading technology company specializing in search, cloud computing, and AI.',
    hiringStatus: 'Active',
    documents: [
      {
        id: 'doc1',
        name: 'Google Interview Questions 2023.pdf',
        type: 'Question Paper',
        size: '2.4 MB',
        filename: 'google-interview-questions-2023.pdf',
        url: 'https://example.com/documents/google-interview-questions-2023.pdf',
        description: 'Comprehensive collection of Google interview questions for software engineering positions',
        uploadDate: new Date()
      },
      {
        id: 'doc2',
        name: 'Google Hiring Process Report.pdf',
        type: 'Interview Report',
        size: '1.8 MB',
        filename: 'google-hiring-process-report.pdf',
        url: 'https://example.com/documents/google-hiring-process-report.pdf',
        description: 'Detailed report on Google\'s hiring process and interview stages',
        uploadDate: new Date()
      },
      {
        id: 'doc3',
        name: 'Google Company Brochure.pdf',
        type: 'Company Brochure',
        size: '3.2 MB',
        filename: 'google-company-brochure.pdf',
        url: 'https://example.com/documents/google-company-brochure.pdf',
        description: 'Official Google company brochure with culture and values information',
        uploadDate: new Date()
      }
    ]
  },
  {
    name: 'Microsoft',
    industry: 'Technology',
    location: 'Redmond, WA',
    website: 'https://microsoft.com',
    companySize: '1000+',
    description: 'Global technology company focused on productivity, cloud services, and enterprise solutions.',
    hiringStatus: 'Active',
    documents: [
      {
        id: 'doc4',
        name: 'Microsoft Technical Interview Guide.pdf',
        type: 'Question Paper',
        size: '3.1 MB',
        filename: 'microsoft-technical-interview-guide.pdf',
        url: 'https://example.com/documents/microsoft-technical-interview-guide.pdf',
        description: 'Complete guide for Microsoft technical interviews including coding challenges',
        uploadDate: new Date()
      },
      {
        id: 'doc5',
        name: 'Microsoft Culture Overview.pdf',
        type: 'Company Brochure',
        size: '1.5 MB',
        filename: 'microsoft-culture-overview.pdf',
        url: 'https://example.com/documents/microsoft-culture-overview.pdf',
        description: 'Overview of Microsoft\'s company culture, values, and work environment',
        uploadDate: new Date()
      }
    ]
  },
  {
    name: 'Amazon',
    industry: 'E-commerce',
    location: 'Seattle, WA',
    website: 'https://amazon.com',
    companySize: '1000+',
    description: 'Multinational technology company focusing on e-commerce, cloud computing, and AI.',
    hiringStatus: 'Active',
    documents: []
  }
];

const sampleJobRoles = [
  {
    title: 'Software Engineer',
    company: 'Google',
    level: 'Entry-Level',
    type: 'Full-time',
    location: 'Mountain View, CA',
    salary: {
      min: 120000,
      max: 180000,
      currency: 'USD'
    },
    description: 'Develop and maintain software applications using modern technologies.',
    requirements: [
      'Bachelor\'s degree in Computer Science or related field',
      'Strong programming skills in Python, Java, or C++',
      'Experience with data structures and algorithms',
      'Good problem-solving abilities'
    ],
    responsibilities: [
      'Design and implement software solutions',
      'Collaborate with cross-functional teams',
      'Write clean, maintainable code',
      'Participate in code reviews'
    ],
    skills: ['Python', 'Java', 'JavaScript', 'React', 'Node.js'],
    registrationLastDate: new Date('2024-12-31')
  },
  {
    title: 'Product Manager',
    company: 'Microsoft',
    level: 'Mid-Level',
    type: 'Full-time',
    location: 'Redmond, WA',
    salary: {
      min: 140000,
      max: 200000,
      currency: 'USD'
    },
    description: 'Lead product development and strategy for enterprise software solutions.',
    requirements: [
      'MBA or Bachelor\'s degree in Business or Technology',
      '3+ years of product management experience',
      'Strong analytical and communication skills',
      'Experience with agile methodologies'
    ],
    responsibilities: [
      'Define product roadmap and strategy',
      'Work with engineering and design teams',
      'Analyze market trends and user needs',
      'Manage product launches and iterations'
    ],
    skills: ['Product Management', 'Agile', 'Analytics', 'Leadership', 'Communication'],
    registrationLastDate: new Date('2024-11-30')
  },
  {
    title: 'Data Scientist',
    company: 'Amazon',
    level: 'Senior',
    type: 'Full-time',
    location: 'Seattle, WA',
    salary: {
      min: 160000,
      max: 220000,
      currency: 'USD'
    },
    description: 'Build machine learning models and data-driven solutions for e-commerce.',
    requirements: [
      'PhD or Master\'s degree in Data Science, Statistics, or related field',
      '5+ years of experience in machine learning',
      'Proficiency in Python, R, and SQL',
      'Experience with big data technologies'
    ],
    responsibilities: [
      'Develop and deploy ML models',
      'Analyze large datasets',
      'Collaborate with engineering teams',
      'Present findings to stakeholders'
    ],
    skills: ['Python', 'R', 'SQL', 'Machine Learning', 'TensorFlow', 'AWS'],
    registrationLastDate: new Date('2024-10-31')
  }
];

const sampleWorkflows = [
  {
    name: 'Google Software Engineer Interview Process',
    company: 'Google',
    description: 'Comprehensive technical interview process for software engineering roles',
    difficulty: 'High',
    stages: [
      { name: 'Phone Screening', duration: '30 min', type: 'Phone', order: 1, description: 'Initial technical screening' },
      { name: 'Technical Round 1', duration: '45 min', type: 'Video', order: 2, description: 'Coding and algorithms' },
      { name: 'Technical Round 2', duration: '60 min', type: 'Video', order: 3, description: 'System design and coding' },
      { name: 'System Design', duration: '60 min', type: 'Video', order: 4, description: 'Large-scale system design' },
      { name: 'Behavioral Interview', duration: '45 min', type: 'Video', order: 5, description: 'Leadership and teamwork' },
      { name: 'Final Review', duration: '30 min', type: 'Panel', order: 6, description: 'Hiring committee review' }
    ]
  },
  {
    name: 'Microsoft Product Manager Interview Process',
    company: 'Microsoft',
    description: 'Structured interview process for product management positions',
    difficulty: 'Medium',
    stages: [
      { name: 'Initial Screening', duration: '30 min', type: 'Phone', order: 1, description: 'Background and motivation' },
      { name: 'Product Case Study', duration: '60 min', type: 'Video', order: 2, description: 'Product strategy and design' },
      { name: 'Behavioral Questions', duration: '45 min', type: 'Video', order: 3, description: 'Leadership and collaboration' },
      { name: 'Leadership Assessment', duration: '45 min', type: 'Video', order: 4, description: 'Team management scenarios' },
      { name: 'Team Fit Interview', duration: '30 min', type: 'Video', order: 5, description: 'Cultural fit assessment' }
    ]
  },
  {
    name: 'Amazon Data Scientist Interview Process',
    company: 'Amazon',
    description: 'Technical interview process for data science and ML roles',
    difficulty: 'High',
    stages: [
      { name: 'Resume Review', duration: '15 min', type: 'Screening', order: 1, description: 'Initial resume evaluation' },
      { name: 'Technical Screening', duration: '45 min', type: 'Phone', order: 2, description: 'ML concepts and statistics' },
      { name: 'Coding Challenge', duration: '90 min', type: 'Video', order: 3, description: 'Data manipulation and analysis' },
      { name: 'ML System Design', duration: '60 min', type: 'Video', order: 4, description: 'End-to-end ML pipeline design' },
      { name: 'Statistics & Probability', duration: '45 min', type: 'Video', order: 5, description: 'Statistical concepts and applications' },
      { name: 'Behavioral Round', duration: '30 min', type: 'Video', order: 6, description: 'Amazon Leadership Principles' }
    ]
  }
];

// Seed function
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await Company.deleteMany({});
    await JobRole.deleteMany({});
    await Workflow.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Insert companies
    const companies = await Company.insertMany(sampleCompanies);
    console.log(`✅ Inserted ${companies.length} companies`);

    // Insert job roles
    const jobRoles = await JobRole.insertMany(sampleJobRoles);
    console.log(`✅ Inserted ${jobRoles.length} job roles`);

    // Insert workflows
    const workflows = await Workflow.insertMany(sampleWorkflows);
    console.log(`✅ Inserted ${workflows.length} workflows`);

    // Update company stats
    for (let company of companies) {
      const roleCount = await JobRole.countDocuments({ company: company.name });
      const workflowCount = await Workflow.countDocuments({ company: company.name });
      
      company.roles = roleCount;
      company.workflows = workflowCount;
      await company.save();
    }
    console.log('📊 Updated company statistics');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Companies: ${companies.length}`);
    console.log(`   Job Roles: ${jobRoles.length}`);
    console.log(`   Workflows: ${workflows.length}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run seeding
seedDatabase();
