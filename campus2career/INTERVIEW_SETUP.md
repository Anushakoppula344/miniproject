# AI-Powered Interview System Setup Guide

This guide will help you set up the complete AI-powered interview system with Web Speech API (TTS + STT) and Google Gemini integration.

## 🎯 System Overview

The interview system provides:
- **User Information Collection**: Role, interview type, skill level
- **AI Question Generation**: Using Google Gemini
- **Voice Interview**: Using Web Speech API for TTS/STT
- **AI Feedback Analysis**: Using Google Gemini
- **Results Display**: Beautiful results page with actionable insights

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **MongoDB Atlas** account
3. **Google Gemini API** key
4. **Modern browser** with Web Speech API support (Chrome/Edge recommended)
5. **Next.js** project setup

## 🔧 Environment Variables

Create a `.env.local` file in the project root:

```bash
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/interview_system

# Google Gemini API
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# Web Speech API (no keys required)
# Works in modern browsers with microphone permissions
# HTTPS required in production
```

## 📦 Installation

1. **Install dependencies**:
```bash
npm install mongodb @google/generative-ai
```

2. **Web Speech API** is built into modern browsers - no installation needed

## 🗄️ Database Setup

### MongoDB Atlas Collections

The system uses these collections:

1. **user_details**: Stores user information
2. **questions**: Stores generated interview questions
3. **feedback**: Stores interview feedback and analysis
4. **sessions**: Tracks interview session state

### Database Schema

```javascript
// User Details
{
  sessionId: string,
  name: string,
  role: string,
  interviewType: string,
  skillLevel: string,
  experience: string,
  createdAt: Date,
  updatedAt: Date
}

// Questions
{
  sessionId: string,
  userInfo: UserDetails,
  questions: [
    {
      id: number,
      text: string,
      type: 'technical' | 'behavioral' | 'case-study' | 'situational',
      difficulty: 'easy' | 'medium' | 'hard',
      category: string
    }
  ],
  createdAt: Date,
  updatedAt: Date
}

// Feedback
{
  sessionId: string,
  userInfo: UserDetails,
  questions: Question[],
  answers: Answer[],
  feedback: {
    overallScore: number,
    summary: string,
    strengths: string[],
    weaknesses: string[],
    recommendations: string[],
    detailedAnalysis: {
      technicalSkills: string,
      communication: string,
      problemSolving: string,
      experience: string
    }
  },
  createdAt: Date,
  updatedAt: Date
}
```

## 🎤 Web Speech API Setup

### 1. Browser Compatibility
- **Chrome/Edge**: Full support for both TTS and STT
- **Firefox**: Limited STT support, full TTS support
- **Safari**: Limited support, may require polyfills

### 2. Microphone Permissions
- Users must grant microphone access
- Browser will prompt for permission on first use
- HTTPS required in production environments

### 3. Implementation
- No API keys or external services required
- Built into modern browsers
- Automatic fallback to manual typing if voice fails

### 4. Testing
- Test page: `http://localhost:3000/interview/setup`
- Verify microphone permissions
- Test voice quality and recognition accuracy


## 🤖 Google Gemini Setup

### 1. Get API Key
- Go to [Google AI Studio](https://aistudio.google.com/)
- Create a new API key
- Add it to your environment variables

### 2. Configure Gemini
- The system uses `gemini-pro` model
- Configure rate limits as needed
- Test API connectivity

## 🚀 Running the System

### 1. Start Development Server
```bash
npm run dev
```

### 2. Access the Interview System
- Main page: `http://localhost:3000/interview`
- Interview setup: `http://localhost:3000/interview/setup`
- Results: `http://localhost:3000/results/[sessionId]`

### 3. Test the Flow
1. Fill out user information form
2. Generate questions with Gemini
3. Start voice interview with Web Speech API
4. Complete interview and get feedback
5. View results page

## 🔄 Interview Flow

### Step 1: User Information
- Collect name, role, interview type, skill level
- Save to MongoDB `user_details` collection

### Step 2: Question Generation
- Call Gemini API with user profile
- Generate personalized interview questions
- Save to MongoDB `questions` collection

### Step 3: Voice Interview
- Use Web Speech API to read questions using TTS
- Capture user answers using STT
- Store transcripts and answers

### Step 4: Feedback Generation
- Send questions + answers to Gemini
- Generate structured feedback
- Save to MongoDB `feedback` collection

### Step 5: Results Display
- Show comprehensive feedback
- Display strengths, weaknesses, recommendations
- Provide actionable insights

## 🛠️ API Endpoints

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

### Feedback
- `POST /api/saveFeedback` - Generate feedback with Gemini
- `GET /api/saveFeedback?sessionId=xxx` - Get feedback

### Webhooks
- `POST /api/interviews/:id/answer` - Submit interview answer

## 🎨 Customization

### Question Types
Modify question generation in `/api/generateQuestions/route.ts`:
- Add new question types
- Customize difficulty levels
- Add role-specific questions

### Feedback Analysis
Customize feedback generation in `/api/saveFeedback/route.ts`:
- Modify scoring criteria
- Add new analysis categories
- Customize recommendations

### UI Styling
Update components in `/app/interview/page.tsx`:
- Modify color schemes
- Add new UI elements
- Customize layouts

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check MONGODB_URI format
   - Verify network access in MongoDB Atlas
   - Check IP whitelist

2. **Gemini API Error**
   - Verify API key is correct
   - Check API quotas and limits
   - Test API connectivity

3. **Web Speech API Issues**
   - Check browser compatibility
   - Verify microphone permissions
   - Test in different browsers
   - Ensure HTTPS in production

4. **Voice Quality Issues**
   - Check microphone permissions
   - Test in different browsers
   - Check microphone quality

### Debug Mode
Enable debug logging by setting:
```bash
NODE_ENV=development
```

## 📊 Monitoring

### Database Monitoring
- Monitor MongoDB Atlas metrics
- Check collection sizes and performance
- Set up alerts for errors

### API Monitoring
- Monitor API response times
- Check error rates
- Set up logging for debugging

### Web Speech API Monitoring
- Check browser compatibility
- Monitor voice recognition accuracy

## 🔒 Security

### API Security
- Use environment variables for secrets
- Implement rate limiting
- Add authentication if needed

### Data Privacy
- Encrypt sensitive data
- Implement data retention policies
- Follow GDPR compliance

## 📈 Scaling

### Performance Optimization
- Implement caching for questions
- Use connection pooling for MongoDB
- Optimize API responses

### Load Balancing
- Use multiple API instances
- Implement horizontal scaling
- Add CDN for static assets

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check Web Speech API and Gemini documentation
4. Contact support if needed

## 📝 License

This project is licensed under the MIT License.