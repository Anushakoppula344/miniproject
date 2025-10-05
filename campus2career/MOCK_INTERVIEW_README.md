# Mock Interview Web App

A full-stack mock interview application built with Next.js (frontend) and Node.js/Express (backend) with MongoDB Atlas for storing user details and interview questions. Features voice interaction using Web Speech API for speech-to-text and text-to-speech.

## 🚀 Features

### Authentication
- User registration and login with JWT authentication
- Secure password hashing with bcrypt
- Token refresh mechanism
- Protected routes and middleware

### User Management
- User profile management
- Role-based interview customization
- Experience tracking
- Skills management

### Interview System
- AI-powered question generation using Google Gemini
- Voice-based interview interaction (STT & TTS)
- Real-time transcript display
- Progress tracking
- Time management

### Feedback System
- AI-generated interview feedback
- Performance scoring
- Strengths and weaknesses analysis
- Improvement suggestions

### UI/UX
- Responsive design with Tailwind CSS
- Modern dashboard interface
- Interview cards with status tracking
- Real-time voice interaction UI

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Web Speech API** - Voice interaction

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### AI Services
- **Google Gemini API** - Question generation and feedback analysis

## 📁 Project Structure

```
mini/campus2career/
├── app/                          # Next.js frontend
│   ├── auth/                     # Authentication pages
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/page.tsx        # Main dashboard
│   └── interview/                # Interview pages
│       └── [id]/
│           ├── page.tsx          # Interview interface
│           └── results/page.tsx  # Results page
├── backend/                      # Express backend
│   ├── models/                   # MongoDB models
│   │   ├── User.js
│   │   └── Interview.js
│   ├── routes/                   # API routes
│   │   ├── auth.js
│   │   ├── users.js
│   │   └── interviews.js
│   ├── middleware/               # Custom middleware
│   │   └── auth.js
│   ├── server.js                 # Main server file
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account
- Google Gemini API key

### 1. Clone and Setup

```bash
# Navigate to the project directory
cd mini/campus2career

# Install frontend dependencies
npm install

# Navigate to backend directory
cd backend

# Install backend dependencies
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mock-interview?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_REFRESH_EXPIRES_IN=30d

# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 3. Database Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Update the `MONGODB_URI` in your `.env` file

### 4. Gemini API Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Update the `GEMINI_API_KEY` in your `.env` file

### 5. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd .. # Go back to main directory
npm run dev
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/api/health

## 📱 Usage Guide

### 1. User Registration
- Visit http://localhost:3000/auth/register
- Fill in your details (name, email, password, role, etc.)
- Click "Create account"

### 2. User Login
- Visit http://localhost:3000/auth/login
- Enter your email and password
- Click "Sign in"

### 3. Dashboard
- View your interview statistics
- Create new interviews
- Manage existing interviews

### 4. Taking an Interview
- Click "Start Interview" on any draft interview
- Allow microphone access for voice interaction
- Answer questions using voice or typing
- Submit answers to proceed

### 5. View Results
- After completing an interview, view detailed feedback
- See your performance score
- Review strengths, weaknesses, and suggestions

## 🎤 Voice Features

### Speech-to-Text (STT)
- Uses Web Speech API for real-time voice recognition
- Supports multiple languages
- Shows live transcript during recording
- Fallback to manual typing

### Text-to-Speech (TTS)
- Reads questions aloud using Web Speech API
- Configurable voice settings
- Visual feedback during speech

### Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Limited support
- Safari: Limited support

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/change-password` - Change password
- `GET /api/users/stats` - Get user statistics
- `DELETE /api/users/account` - Delete account

### Interviews
- `POST /api/interviews` - Create new interview
- `GET /api/interviews` - Get user's interviews
- `GET /api/interviews/:id` - Get specific interview
- `POST /api/interviews/:id/start` - Start interview
- `POST /api/interviews/:id/answer` - Submit answer
- `POST /api/interviews/:id/complete` - Complete interview
- `DELETE /api/interviews/:id` - Delete interview

## 🗄️ Database Schema

### Users Collection
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String,
  interviewType: String,
  yearsOfExperience: Number,
  skills: [String],
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Interviews Collection
```javascript
{
  userId: ObjectId,
  title: String,
  role: String,
  interviewType: String,
  difficulty: String,
  questions: [{
    question: String,
    answer: String,
    transcript: String,
    timeSpent: Number,
    isAnswered: Boolean,
    answeredAt: Date
  }],
  status: String,
  currentQuestionIndex: Number,
  totalQuestions: Number,
  duration: Number,
  feedback: {
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    overallScore: Number,
    generatedAt: Date
  },
  startedAt: Date,
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation
- SQL injection prevention
- XSS protection

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables
3. Deploy automatically

### Backend (Railway/Heroku)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

### Database (MongoDB Atlas)
1. Create production cluster
2. Update connection string
3. Configure IP whitelist

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `CORS_ORIGIN` in backend `.env`
   - Ensure frontend URL matches

2. **MongoDB Connection**
   - Verify connection string
   - Check IP whitelist
   - Ensure cluster is running

3. **Gemini API Errors**
   - Verify API key
   - Check API quotas
   - Ensure proper permissions

4. **Voice Features Not Working**
   - Check browser compatibility
   - Ensure microphone permissions
   - Use HTTPS in production

### Debug Mode
Set `NODE_ENV=development` to see detailed error messages.

## 📈 Performance Optimization

- Database indexing
- API response caching
- Image optimization
- Code splitting
- Lazy loading

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

---

**Happy Interviewing! 🎤✨**
