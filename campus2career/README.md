# 🎓 Campus2Career - AI-Powered Interview & Career Platform

A comprehensive full-stack career platform built with Next.js (frontend) and Node.js/Express (backend), featuring AI-powered mock interviews, company opportunities, job role management, and administrative controls.

## 🏗️ Project Structure

```
campus2career/
├── frontend/                 # Next.js React Application
│   ├── app/                 # Next.js App Router
│   │   ├── admin/           # Admin Portal
│   │   │   ├── dashboard/   # Admin Dashboard
│   │   │   ├── companies/   # Companies Management
│   │   │   ├── job-roles/   # Job Roles Management
│   │   │   ├── workflows/   # Hiring Workflows
│   │   │   └── profile/     # Admin Profile
│   │   ├── auth/            # Authentication Pages
│   │   ├── dashboard/       # User Dashboard
│   │   ├── interview/       # Interview System
│   │   ├── opportunities/   # Job Opportunities
│   │   ├── company/         # Company Details
│   │   ├── profile/         # User Profile
│   │   └── results/         # Interview Results
│   ├── components/          # React Components
│   │   ├── ui/              # UI Components
│   │   ├── Navbar.tsx       # Navigation Bar
│   │   ├── CircularProgress.tsx
│   │   ├── ThemeToggle.tsx  # Dark/Light Theme
│   │   └── ...
│   ├── lib/                 # Utility Functions
│   ├── public/              # Static Assets
│   ├── types/               # TypeScript Types
│   └── constants/           # App Constants
├── backend/                 # Node.js/Express API
│   ├── models/              # Mongoose Models
│   │   ├── User.js          # User Model
│   │   └── Interview.js     # Interview Model
│   ├── routes/              # API Routes
│   │   ├── auth.js          # Authentication
│   │   ├── users.js         # User Management
│   │   └── interviews.js    # Interview API
│   ├── middleware/          # Express Middleware
│   │   └── auth.js          # JWT Authentication
│   ├── uploads/             # File Storage
│   │   ├── profile-pictures/
│   │   └── companies/
│   └── server.js            # Main Server File
├── package.json             # Root Package Manager
├── start-dev.bat            # Windows Development Script
├── start-dev.ps1            # PowerShell Development Script
└── README.md                # This File
```

## ✨ Features

### 🎯 Core Features

#### For Students/Users
- **🔐 User Authentication**: Secure JWT-based login/registration with role-based access
- **🎤 AI Mock Interviews**: Real-time voice interviews with AI-powered question generation
- **📊 Interview Analytics**: Comprehensive performance analysis with visual charts and metrics
- **💼 Job Opportunities**: Browse companies and job roles with application tracking
- **👤 Profile Management**: Complete profile customization with skills, bio, and social links
- **🌙 Dark/Light Theme**: System-wide theme toggle with persistent preferences
- **🔔 Notifications**: Real-time notifications for important updates and activities
- **📈 Progress Tracking**: Track interview performance over time with detailed feedback

#### For Administrators
- **🏢 Company Management**: Add, edit, and delete companies with document uploads
- **💼 Job Role Management**: Manage job postings with skills, salary, and deadlines
- **🔄 Hiring Workflows**: Create and manage multi-stage hiring processes
- **📊 Admin Dashboard**: Overview of platform statistics and recent activities
- **👤 Admin Profile**: Full profile management for administrators
- **📱 Activity Tracking**: Monitor all platform activities in real-time
- **🎨 Consistent Branding**: Unified Campus2Career logo across all admin pages

### 🎨 User Experience Features
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **🎯 Intuitive Navigation**: Easy-to-use interface with clear call-to-actions
- **⚡ Fast Performance**: Optimized loading and smooth transitions
- **♿ Accessibility**: WCAG compliant with keyboard navigation support
- **🎭 Modern UI**: Beautiful gradient designs and smooth animations
- **🔍 Smart Search**: Filter and search across companies, roles, and opportunities

### 🛠️ Technology Stack

#### Frontend
- **Next.js 15.5.3** - React framework with App Router
- **TypeScript** - Type-safe JavaScript for robust development
- **TailwindCSS** - Utility-first CSS framework with custom themes
- **Web Speech API** - Browser-native voice features for interviews
- **React Hook Form** - Efficient form management with validation
- **Radix UI** - Accessible component primitives
- **Recharts** - Beautiful, composable charts for analytics
- **Sonner** - Toast notifications system

#### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Fast, minimal web framework
- **MongoDB Atlas** - Cloud NoSQL database
- **Mongoose** - Elegant MongoDB object modeling
- **JWT** - Secure authentication tokens
- **Multer** - File upload handling for documents and images
- **Google Gemini API** - AI-powered question generation and feedback
- **bcrypt** - Secure password hashing

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB Atlas** account (free tier available)
- **Google Gemini API** key (free tier available)
- **Modern Web Browser** (Chrome, Edge, or Firefox recommended)

### 1. Clone and Install
```bash
# Clone the repository
git clone https://github.com/Anushakoppula344/miniproject.git
cd miniproject/mini/campus2career

# Install all dependencies (root, frontend, and backend)
npm run install:all
```

### 2. Environment Setup

#### Backend Environment (`backend/.env`)
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campus2career

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-token-secret

# AI Service
GOOGLE_GEMINI_API_KEY=your-gemini-api-key

# Server
PORT=5000
NODE_ENV=development

# CORS (for production)
FRONTEND_URL=http://localhost:3000
```

#### Frontend Environment (`frontend/.env.local`)
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# Feature Flags (optional)
NEXT_PUBLIC_ENABLE_VOICE=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### 3. Start Development Servers

#### Option 1: Start Both Servers (Recommended)
```bash
# Start both frontend and backend concurrently
npm run dev
```

#### Option 2: Start Individually
```bash
# Terminal 1 - Backend (Port 5000)
cd backend
npm run dev

# Terminal 2 - Frontend (Port 3000)
cd frontend
npm run dev
```

#### Option 3: Use Platform Scripts
```bash
# Windows Command Prompt
start-dev.bat

# PowerShell
./start-dev.ps1
```

### 4. Access the Application
- **🌐 Frontend**: http://localhost:3000
- **🔧 Backend API**: http://localhost:5000
- **💚 Health Check**: http://localhost:5000/api/health

### 5. Default Admin Access
```
Email: admin@campus2career.com
Password: admin123
```

## 📱 User Guide

### For Students

#### 1. Getting Started
1. Visit http://localhost:3000
2. Click **"Sign Up"** to create an account
3. Fill in your details (name, email, university, skills)
4. Verify your email and log in

#### 2. Taking Mock Interviews
1. Navigate to **"Interview"** from the dashboard
2. Click **"Start New Interview"**
3. Configure settings:
   - Select job role (e.g., Software Engineer)
   - Choose interview type (Technical, Behavioral, HR)
   - Set difficulty level
   - Specify number of questions
4. Allow microphone permissions
5. Answer questions using voice or text
6. View real-time feedback and results

#### 3. Exploring Opportunities
1. Click **"Opportunities"** in the navigation
2. Browse companies and job roles
3. Filter by industry, location, or skills
4. View detailed company information
5. Save opportunities for later
6. Click **"Apply Now"** to visit application portal

#### 4. Managing Your Profile
1. Click your avatar in the top-right corner
2. Select **"Profile"** from dropdown
3. Update personal information
4. Add skills and social links
5. Upload profile picture
6. Configure notification preferences
7. Toggle theme (Dark/Light mode)

### For Administrators

#### 1. Admin Dashboard
- Access at `/admin/dashboard`
- View platform statistics
- Monitor recent activities
- Track total companies and active job roles
- See uploaded documents count

#### 2. Company Management
1. Navigate to **"Companies"** in admin panel
2. Click **"+ Add Company"**
3. Fill in company details:
   - Name, industry, location
   - Website, size, description
4. Upload company documents (PDFs)
5. Edit or delete companies as needed

#### 3. Job Role Management
1. Go to **"Job Roles"** section
2. Click **"+ Create Job Role"**
3. Configure job details:
   - Title and company
   - Required skills
   - Salary range
   - Registration deadline
4. Manage active/inactive roles
5. Bulk status updates

#### 4. Admin Profile
1. Click your avatar in admin header
2. Access **"Admin Profile"**
3. Update personal information
4. View admin role badge
5. Quick links to admin functions

## 🔧 Development

### Project Architecture

#### Component Structure
```
components/
├── ui/              # Reusable UI components (Button, Input, etc.)
├── Navbar.tsx       # Main navigation with user menu
├── CircularProgress.tsx  # Animated progress indicators
├── ThemeToggle.tsx  # Dark/light theme switcher
├── AdminProtection.tsx   # Route protection for admin
└── ...
```

#### State Management
- **Local Storage**: User session and preferences
- **React Context**: Theme, notifications, activities
- **Server State**: API data fetching and caching

#### Styling Approach
- **TailwindCSS**: Utility-first styling
- **Dark Mode**: `dark:` prefixes for theme variants
- **Custom Classes**: Gradient backgrounds and animations
- **Responsive**: Mobile-first design philosophy

### Available Scripts

#### Root Level
```bash
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start only frontend (port 3000)
npm run dev:backend      # Start only backend (port 5000)
npm run build            # Build frontend for production
npm run install:all      # Install all dependencies
npm run test:db          # Test MongoDB Atlas connection
```

#### Frontend (`cd frontend`)
```bash
npm run dev              # Start Next.js dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint checker
```

#### Backend (`cd backend`)
```bash
npm run dev              # Start with nodemon (auto-restart)
npm start                # Start production server
npm test                 # Run test suite
```

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

#### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/profile-picture` - Upload profile picture
- `GET /api/users/preferences` - Get user preferences
- `PUT /api/users/preferences` - Update preferences

#### Interviews
- `POST /api/interviews` - Create new interview
- `GET /api/interviews` - Get user's interviews
- `GET /api/interviews/:id` - Get specific interview
- `POST /api/interviews/:id/answer` - Submit answer
- `POST /api/interviews/:id/feedback` - Generate AI feedback
- `PUT /api/interviews/:id/complete` - Complete interview

#### Companies (Admin)
- `GET /api/companies` - List all companies
- `POST /api/companies` - Create company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company
- `POST /api/companies/:id/documents` - Upload documents
- `DELETE /api/companies/:id/documents/:docId` - Delete document

#### Job Roles (Admin)
- `GET /api/job-roles` - List all job roles
- `POST /api/job-roles` - Create job role
- `PUT /api/job-roles/:id` - Update job role
- `DELETE /api/job-roles/:id` - Delete job role
- `POST /api/job-roles/bulk-status-update` - Bulk update status

#### Workflows (Admin)
- `GET /api/workflows` - List hiring workflows
- `POST /api/workflows` - Create workflow
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow

## 🗄️ Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  fullName: String,
  email: String (unique),
  password: String (bcrypt hashed),
  role: String (enum: ['user', 'admin']),
  phone: String,
  university: String,
  graduationYear: String,
  major: String,
  skills: [String],
  bio: String,
  location: String,
  linkedinUrl: String,
  githubUrl: String,
  portfolioUrl: String,
  profilePicture: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Interviews Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User'),
  title: String,
  role: String,
  interviewType: String (enum: ['technical', 'behavioral', 'hr']),
  difficulty: String (enum: ['easy', 'medium', 'hard']),
  totalQuestions: Number,
  currentQuestionIndex: Number,
  questions: [{
    question: String,
    answer: String,
    transcript: String,
    timeSpent: Number,
    score: Number
  }],
  feedback: {
    strengths: [String],
    weaknesses: [String],
    areasForImprovement: [String],
    overallScore: Number,
    technicalScore: Number,
    communicationScore: Number,
    problemSolvingScore: Number
  },
  transcript: String,
  status: String (enum: ['pending', 'in-progress', 'completed']),
  createdAt: Date,
  updatedAt: Date
}
```

### Companies Collection
```javascript
{
  _id: ObjectId,
  name: String (required, unique),
  industry: String,
  location: String,
  website: String,
  companySize: String (enum),
  description: String,
  logo: String,
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadDate: Date
  }],
  createdBy: ObjectId (ref: 'User'),
  createdAt: Date,
  updatedAt: Date
}
```

### JobRoles Collection
```javascript
{
  _id: ObjectId,
  title: String (required),
  company: ObjectId (ref: 'Company'),
  level: String (enum: ['Entry', 'Mid', 'Senior']),
  skills: [String],
  description: String,
  salary: {
    min: Number,
    max: Number,
    currency: String
  },
  registrationLastDate: Date,
  status: String (enum: ['active', 'closed', 'draft']),
  createdBy: ObjectId (ref: 'User'),
  createdAt: Date,
  updatedAt: Date
}
```

## 🎨 Theme System

### Dark/Light Mode Implementation
```typescript
// Theme is managed via React Context
const { theme, toggleTheme } = useTheme();

// Theme persists in localStorage
// Automatically applies to all components with dark: classes
```

### Brand Colors
- **Primary**: Indigo (600-700)
- **Success**: Green (500-600)
- **Warning**: Yellow (500-600)
- **Error**: Red (500-600)
- **Neutral**: Slate/Gray

### Campus2Career Logo
```tsx
{/* Animated bar chart logo */}
<div className="flex items-end space-x-1">
  <div className="w-2 bg-indigo-600 dark:bg-indigo-400 rounded-t-sm" style={{height: '20px'}} />
  <div className="w-2 bg-gray-500 dark:bg-gray-400 rounded-t-sm" style={{height: '12px'}} />
  <div className="w-2 bg-indigo-700 dark:bg-indigo-300 rounded-t-sm" style={{height: '28px'}} />
  <div className="w-2 bg-indigo-600 dark:bg-indigo-400 rounded-t-sm" style={{height: '24px'}} />
  <div className="w-2 bg-indigo-700 dark:bg-indigo-300 rounded-t-sm" style={{height: '16px'}} />
</div>
```

## 🚀 Deployment

### Frontend Deployment (Vercel)
```bash
cd frontend
npm run build

# Deploy to Vercel
vercel deploy --prod
```

**Environment Variables for Vercel:**
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

### Backend Deployment (Railway/Render)
```bash
cd backend

# Deploy via Railway CLI
railway up

# Or via Render
# Push to GitHub and connect repository
```

**Environment Variables for Production:**
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=production-secret-key
GOOGLE_GEMINI_API_KEY=your-key
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.com
```

### File Uploads Configuration
For production, configure cloud storage:
- **AWS S3** for scalable file storage
- **Cloudinary** for image optimization
- Update Multer configuration in backend

## 🐛 Troubleshooting

### Common Issues

#### Voice Features Not Working
- ✅ Check browser compatibility (Chrome/Edge recommended)
- ✅ Ensure microphone permissions are granted
- ✅ Use HTTPS in production (required for Web Speech API)
- ✅ Test with http://localhost (exempt from HTTPS requirement)

#### Database Connection Issues
- ✅ Verify MongoDB Atlas connection string
- ✅ Check IP whitelist in Atlas (allow 0.0.0.0/0 for testing)
- ✅ Ensure database user has correct permissions
- ✅ Run `npm run test:db` to test connection

#### Authentication Issues
- ✅ Clear browser localStorage
- ✅ Check JWT_SECRET is set correctly
- ✅ Verify token expiration settings
- ✅ Ensure CORS is configured for your domain

#### Port Conflicts
- ✅ Frontend defaults to port 3000
- ✅ Backend defaults to port 5000
- ✅ Change in respective package.json if needed
- ✅ Kill existing processes: `npx kill-port 3000 5000`

#### File Upload Issues
- ✅ Check backend/uploads directory permissions
- ✅ Verify file size limits (default: 5MB)
- ✅ Ensure correct MIME types are allowed
- ✅ Check disk space availability

#### Dark Theme Issues
- ✅ Clear localStorage theme preferences
- ✅ Verify Tailwind dark mode is enabled
- ✅ Check system theme preferences
- ✅ Test in different browsers

## 📚 Documentation

- [MongoDB Atlas Setup Guide](./MONGODB_ATLAS_SETUP.md)
- [Interview System Documentation](./README_INTERVIEW.md)
- [Interview Setup Guide](./INTERVIEW_SETUP.md)

## 🔒 Security Features

- **🔐 Password Hashing**: bcrypt with salt rounds
- **🎫 JWT Authentication**: Secure token-based auth
- **🛡️ Input Validation**: Server-side validation for all inputs
- **🚫 SQL Injection Prevention**: MongoDB native protection
- **🔒 CORS Configuration**: Controlled cross-origin requests
- **📝 Rate Limiting**: Prevent brute force attacks (recommended for production)
- **🔑 Environment Variables**: Sensitive data protection

## 📊 Performance Optimizations

- **⚡ Code Splitting**: Next.js automatic code splitting
- **🖼️ Image Optimization**: Next.js Image component
- **📦 Bundle Size**: Optimized with tree-shaking
- **🚀 API Caching**: Strategic caching for static data
- **💾 Database Indexing**: Optimized MongoDB queries
- **🔄 Lazy Loading**: Components loaded on demand

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Maintain consistent code formatting
- Write meaningful commit messages
- Test thoroughly before submitting
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Web Speech API** - Free browser-native voice capabilities
- **Google Gemini** - AI-powered question generation and feedback
- **MongoDB Atlas** - Reliable cloud database services
- **Next.js** - Powerful React framework with amazing DX
- **TailwindCSS** - Beautiful, utility-first styling
- **Vercel** - Seamless deployment platform
- **Recharts** - Elegant charting library
- **Radix UI** - Accessible component primitives

## 👥 Team

- **Project Lead**: Anusha Koppula
- **Repository**: [github.com/Anushakoppula344/miniproject](https://github.com/Anushakoppula344/miniproject)

## 🆘 Support

For issues, questions, or suggestions:
- 🐛 **Bug Reports**: Open an issue on GitHub
- 💡 **Feature Requests**: Submit via GitHub Issues
- 📧 **Email**: support@campus2career.com (if configured)

## 🗺️ Roadmap

### Upcoming Features
- [ ] Video interview support with recording
- [ ] AI resume analysis and suggestions
- [ ] Peer-to-peer mock interview matching
- [ ] Interview scheduling calendar
- [ ] Mobile application (React Native)
- [ ] Advanced analytics dashboard
- [ ] Email notifications system
- [ ] Multi-language support
- [ ] Integration with LinkedIn/GitHub
- [ ] Company career page widgets

---

**🎓 Built with ❤️ for helping students succeed in their career journey**

**Happy Interviewing! 🎤✨**
