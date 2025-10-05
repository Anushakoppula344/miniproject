# 🎤 Mock Interview Web App

A full-stack mock interview application built with Next.js (frontend) and Node.js/Express (backend), featuring voice interaction using Web Speech API and AI-powered question generation with Google Gemini.

## 🏗️ Project Structure

```
mock-interview-app/
├── frontend/                 # Next.js React Application
│   ├── app/                 # Next.js App Router
│   ├── components/          # React Components
│   ├── lib/                 # Utility Functions
│   ├── public/              # Static Assets
│   ├── types/               # TypeScript Types
│   ├── constants/           # App Constants
│   ├── package.json         # Frontend Dependencies
│   └── ...
├── backend/                 # Node.js/Express API
│   ├── models/              # Mongoose Models
│   ├── routes/              # API Routes
│   ├── middleware/          # Express Middleware
│   ├── package.json         # Backend Dependencies
│   └── server.js            # Main Server File
├── package.json             # Root Package Manager
├── start-dev.bat            # Windows Development Script
├── start-dev.ps1            # PowerShell Development Script
└── README.md                # This File
```

## ✨ Features

### 🎯 Core Features
- **User Authentication**: JWT-based login/registration
- **Voice Interviews**: Real-time speech-to-text and text-to-speech
- **AI Question Generation**: Personalized questions using Google Gemini
- **Live Transcripts**: Real-time display of questions and answers
- **AI Feedback**: Comprehensive feedback analysis
- **Cloud Storage**: MongoDB Atlas for data persistence

### 🛠️ Technology Stack

#### Frontend
- **Next.js 15.5.3** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first CSS framework
- **Web Speech API** - Browser-native voice features
- **React Hook Form** - Form management
- **Radix UI** - Accessible component primitives

#### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB Atlas** - Cloud database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication tokens
- **Google Gemini API** - AI question generation

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account
- Google Gemini API key

### 1. Clone and Install
```bash
# Clone the repository
git clone <your-repo-url>
cd mock-interview-app

# Install all dependencies (root, frontend, and backend)
npm run install:all
```

### 2. Environment Setup

#### Backend Environment (`backend/.env`)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mock-interview
JWT_SECRET=your-super-secret-jwt-key
GOOGLE_GEMINI_API_KEY=your-gemini-api-key
PORT=5000
```

#### Frontend Environment (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Start Development Servers

#### Option 1: Start Both Servers
```bash
# Start both frontend and backend
npm run dev
```

#### Option 2: Start Individually
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend  
npm run dev:frontend
```

#### Option 3: Use Scripts
```bash
# Windows
start-dev.bat

# PowerShell
./start-dev.ps1
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/api/health

## 📱 Usage

### 1. User Registration
- Visit http://localhost:3000
- Click "Sign Up" to create an account
- Fill in your details (name, email, role, experience)

### 2. Take an Interview
- Click "Take Interview" on the dashboard
- Configure interview settings (role, type, difficulty)
- Allow microphone permissions for voice features
- Answer questions using voice or typing
- View AI-generated feedback

### 3. Voice Features
- **Text-to-Speech**: Questions are read aloud
- **Speech-to-Text**: Your answers are captured by voice
- **Live Transcript**: See both questions and answers in real-time
- **Browser Compatibility**: Works best in Chrome/Edge

## 🔧 Development

### Project Structure Benefits
- **Separation of Concerns**: Frontend and backend are completely separate
- **Independent Development**: Teams can work on frontend/backend independently
- **Scalability**: Each part can be deployed separately
- **Maintainability**: Clear boundaries and responsibilities

### Available Scripts

#### Root Level
```bash
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start only frontend
npm run dev:backend      # Start only backend
npm run build            # Build frontend for production
npm run install:all      # Install all dependencies
npm run test:db          # Test MongoDB Atlas connection
```

#### Frontend (`cd frontend`)
```bash
npm run dev              # Start Next.js development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
```

#### Backend (`cd backend`)
```bash
npm run dev              # Start with nodemon (auto-restart)
npm start                # Start production server
npm test                 # Run tests
```

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/token` - Refresh token

#### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

#### Interviews
- `POST /api/interviews` - Create new interview
- `GET /api/interviews` - Get user's interviews
- `GET /api/interviews/:id` - Get specific interview
- `POST /api/interviews/:id/answer` - Submit answer
- `POST /api/interviews/:id/feedback` - Generate feedback

## 🗄️ Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  role: String,
  yearsOfExperience: Number,
  skills: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Interviews Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  title: String,
  role: String,
  interviewType: String,
  difficulty: String,
  totalQuestions: Number,
  currentQuestionIndex: Number,
  questions: [{
    question: String,
    answer: String,
    transcript: String,
    timeSpent: Number
  }],
  feedback: {
    strengths: [String],
    weaknesses: [String],
    improvementTips: [String],
    overallScore: Number
  },
  status: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy the 'out' folder
```

### Backend Deployment (Railway/Heroku)
```bash
cd backend
# Set environment variables
# Deploy the backend folder
```

### Environment Variables for Production
- Update `NEXT_PUBLIC_API_URL` to your production backend URL
- Set production MongoDB Atlas URI
- Configure production JWT secrets
- Set up CORS for production domains

## 🐛 Troubleshooting

### Common Issues

#### Voice Features Not Working
- Check browser compatibility (Chrome/Edge recommended)
- Ensure microphone permissions are granted
- Verify HTTPS in production

#### Database Connection Issues
- Verify MongoDB Atlas connection string
- Check network access settings
- Run `npm run test:db` to test connection

#### Port Conflicts
- Frontend defaults to port 3000
- Backend defaults to port 5000
- Change ports in respective package.json files if needed

## 📚 Documentation

- [MongoDB Atlas Setup Guide](./MONGODB_ATLAS_SETUP.md)
- [Interview System Documentation](./README_INTERVIEW.md)
- [Interview Setup Guide](./INTERVIEW_SETUP.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Web Speech API** - For free voice capabilities
- **Google Gemini** - For AI question generation
- **MongoDB Atlas** - For cloud database services
- **Next.js** - For the amazing React framework
- **TailwindCSS** - For beautiful styling utilities

---

**Happy Interviewing! 🎤✨**