# 🎤 AI-Powered Interview System

A complete Next.js application that simulates AI interviews using **Web Speech API** (TTS + STT) and **Google Gemini** for intelligent question generation and feedback analysis.

## ✨ Features

### 🎯 Complete Interview Flow
- **User Information Collection**: Role, interview type, skill level, experience
- **AI Question Generation**: Personalized questions using Google Gemini
- **Voice Interview**: Real-time TTS/STT using Web Speech API
- **AI Feedback Analysis**: Comprehensive feedback using Google Gemini
- **Beautiful Results**: Professional results page with actionable insights

### 🛠️ Technical Stack
- **Frontend**: React (Next.js) + TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB Atlas
- **AI Services**: Google Gemini API + Web Speech API
- **Voice**: Text-to-Speech + Speech-to-Text

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Add your API keys
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/interview_system
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
# Web Speech API works in modern browsers (Chrome, Edge, Firefox, Safari)
# No additional API keys required for voice features
```

### 2. Install Dependencies
```bash
npm install mongodb @google/generative-ai
```

### 3. Run the Application
```bash
npm run dev
```

### 4. Access the Interview System
- **Main Interview**: `http://localhost:3000/interview`
- **Interview Setup**: `http://localhost:3000/interview/setup`
- **Results**: `http://localhost:3000/results/[sessionId]`

## 📋 Interview Flow

### Step 1: User Information 📝
```typescript
// Collect user details
const userInfo = {
  name: "John Doe",
  role: "software-engineer",
  interviewType: "technical",
  skillLevel: "mid-level",
  experience: "3 years of React development"
};
```

### Step 2: AI Question Generation 🤖
```typescript
// Gemini generates personalized questions
const questions = [
  {
    id: 1,
    text: "Can you explain your experience with React hooks?",
    type: "technical",
    difficulty: "medium",
    category: "frontend"
  },
  // ... more questions
];
```

### Step 3: Voice Interview 🎤
```typescript
// Web Speech API handles TTS/STT
const speechSynthesis = window.speechSynthesis;
const speechRecognition = new (window as any).webkitSpeechRecognition();
  sessionId,
  questions,
  userInfo
});
```

### Step 4: AI Feedback Analysis 📊
```typescript
// Gemini analyzes interview performance
const feedback = {
  overallScore: 8,
  summary: "Strong technical skills with good communication",
  strengths: ["Clear explanations", "Relevant experience"],
  weaknesses: ["Could provide more examples"],
  recommendations: ["Practice system design questions"]
};
```

## 🗄️ Database Schema

### User Details Collection
```typescript
interface UserDetails {
  sessionId: string;
  name: string;
  role: string;
  interviewType: string;
  skillLevel: string;
  experience: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Questions Collection
```typescript
interface Questions {
  sessionId: string;
  userInfo: UserDetails;
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
}

interface Question {
  id: number;
  text: string;
  type: 'technical' | 'behavioral' | 'case-study' | 'situational';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}
```

### Feedback Collection
```typescript
interface Feedback {
  sessionId: string;
  userInfo: UserDetails;
  questions: Question[];
  answers: Answer[];
  feedback: FeedbackData;
  createdAt: Date;
  updatedAt: Date;
}

interface FeedbackData {
  overallScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  detailedAnalysis: {
    technicalSkills: string;
    communication: string;
    problemSolving: string;
    experience: string;
  };
}
```

## 🔌 API Endpoints

### User Management
- `POST /api/saveUser` - Save user information
- `GET /api/saveUser?sessionId=xxx` - Get user details

### Question Generation
- `POST /api/generateQuestions` - Generate questions with Gemini
- `GET /api/generateQuestions?sessionId=xxx` - Get generated questions

### Interview Management
- `POST /api/interviews` - Create new interview
- `GET /api/session/[sessionId]` - Get session status
- `PUT /api/session/[sessionId]` - Update session

### Feedback Analysis
- `POST /api/saveFeedback` - Generate feedback with Gemini
- `GET /api/saveFeedback?sessionId=xxx` - Get feedback

### Webhooks
- `POST /api/interviews/:id/answer` - Submit interview answer

## 🎨 UI Components

### Interview Page (`/app/interview/page.tsx`)
- **User Information Form**: Collect candidate details
- **Question Generation**: AI-powered question creation
- **Voice Interview Interface**: Real-time TTS/STT
- **Results Display**: Comprehensive feedback

### Results Page (`/app/results/[sessionId]/page.tsx`)
- **Overall Score**: Visual score display
- **Strengths & Weaknesses**: Categorized feedback
- **Recommendations**: Actionable insights
- **Interview Transcript**: Complete Q&A record

### Navigation (`/components/InterviewNav.tsx`)
- **System Navigation**: Easy access to all features
- **Status Indicators**: Real-time system status
- **Responsive Design**: Mobile-friendly interface

## 🔧 Configuration

### Web Speech API Setup
1. **Browser Compatibility**: Works best in Chrome/Edge, limited support in Firefox/Safari
2. **Microphone Permissions**: Users need to allow microphone access
3. **HTTPS Required**: Web Speech API requires secure connection in production
4. **Fallback Support**: Manual typing available if voice features don't work

### Gemini Configuration
1. **API Key**: Get from Google AI Studio
2. **Model Selection**: Uses `gemini-pro` for best results
3. **Rate Limits**: Configure as needed
4. **Prompt Engineering**: Customize for your use case

### MongoDB Atlas
1. **Cluster Setup**: Create cluster and database
2. **Collections**: Set up required collections
3. **Indexes**: Optimize for performance
4. **Security**: Configure access and IP whitelist

## 🎯 Customization

### Question Types
```typescript
// Add new question types in generateQuestions/route.ts
const questionTypes = {
  'software-engineer': [
    "Explain your experience with React hooks",
    "How do you handle state management?",
    "Describe your testing approach"
  ],
  'data-scientist': [
    "Walk me through your ML pipeline",
    "How do you handle overfitting?",
    "Explain feature selection methods"
  ]
};
```

### Feedback Analysis
```typescript
// Customize feedback generation in saveFeedback/route.ts
const feedbackCriteria = {
  technicalSkills: "Evaluate coding ability and technical knowledge",
  communication: "Assess clarity and articulation",
  problemSolving: "Analyze approach to complex problems",
  experience: "Review relevant background and examples"
};
```

### UI Styling
```typescript
// Customize colors and themes
const theme = {
  primary: 'blue-600',
  secondary: 'gray-600',
  success: 'green-600',
  warning: 'orange-600',
  error: 'red-600'
};
```

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Error**
```bash
# Check connection string format
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/interview_system

# Verify network access in MongoDB Atlas
# Check IP whitelist settings
```

**Gemini API Error**
```bash
# Verify API key
GOOGLE_GEMINI_API_KEY=your_actual_api_key_here

# Check API quotas and limits
# Test API connectivity
```

**Web Speech API Issues**
```bash
# Check browser compatibility and permissions
# Ensure HTTPS in production
# Test microphone access
```

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development

# Check console logs for detailed information
# Monitor API responses and errors
```

## 📊 Performance Optimization

### Database Optimization
- **Indexes**: Create indexes on frequently queried fields
- **Connection Pooling**: Use MongoDB connection pooling
- **Query Optimization**: Optimize database queries

### API Optimization
- **Caching**: Implement Redis caching for questions
- **Rate Limiting**: Add rate limiting for API endpoints
- **Response Compression**: Enable gzip compression

### Frontend Optimization
- **Code Splitting**: Implement dynamic imports
- **Image Optimization**: Use Next.js Image component
- **Bundle Analysis**: Analyze and optimize bundle size

## 🔒 Security

### API Security
- **Environment Variables**: Store secrets securely
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Validate all inputs
- **CORS Configuration**: Configure cross-origin requests

### Data Privacy
- **Encryption**: Encrypt sensitive data
- **Data Retention**: Implement data retention policies
- **GDPR Compliance**: Follow privacy regulations
- **Access Control**: Implement proper access controls

## 📈 Scaling

### Horizontal Scaling
- **Load Balancing**: Use multiple API instances
- **Database Sharding**: Implement database sharding
- **CDN**: Use CDN for static assets
- **Microservices**: Split into smaller services

### Performance Monitoring
- **APM Tools**: Use application performance monitoring
- **Logging**: Implement comprehensive logging
- **Metrics**: Monitor key performance indicators
- **Alerts**: Set up automated alerts

## 🆘 Support

### Documentation
- **API Documentation**: Complete API reference
- **Setup Guide**: Detailed setup instructions
- **Troubleshooting**: Common issues and solutions
- **Examples**: Code examples and tutorials

### Community
- **GitHub Issues**: Report bugs and request features
- **Discord**: Join the community for support
- **Stack Overflow**: Ask questions and get help
- **Documentation**: Comprehensive documentation

## 📝 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🙏 Acknowledgments

- **Web Speech API**: For free voice capabilities in modern browsers
- **Google Gemini**: For powerful AI question generation and analysis
- **MongoDB**: For reliable database services
- **Next.js**: For the amazing React framework
- **TailwindCSS**: For beautiful styling utilities

---

**Built with ❤️ for the future of AI-powered interviews**