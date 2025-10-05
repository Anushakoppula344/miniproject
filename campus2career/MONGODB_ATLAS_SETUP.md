# 🗄️ MongoDB Atlas Setup Guide

This guide will help you set up MongoDB Atlas for your Mock Interview Web App.

## 🎯 What is MongoDB Atlas?

MongoDB Atlas is a cloud-based database service that provides:
- **Managed MongoDB**: No need to install MongoDB locally
- **Automatic Backups**: Your data is safe and recoverable
- **Scalability**: Grows with your application
- **Security**: Built-in authentication and encryption
- **Global Clusters**: Deploy close to your users

## 🚀 Step-by-Step Setup

### 1. Create MongoDB Atlas Account

1. **Go to [MongoDB Atlas](https://www.mongodb.com/atlas)**
2. **Click "Try Free"** or "Start Free"
3. **Sign up** with your email or Google account
4. **Verify your email** if required

### 2. Create a New Cluster

1. **Click "Build a Database"**
2. **Choose "MOCK INTERVIEW"** (or any name you prefer)
3. **Select "M0 Sandbox"** (Free tier)
4. **Choose a Cloud Provider** (AWS, Google Cloud, or Azure)
5. **Select a Region** close to your location
6. **Click "Create"**

### 3. Set Up Database Access

1. **Go to "Database Access"** in the left sidebar
2. **Click "Add New Database User"**
3. **Choose "Password" authentication**
4. **Create a username** (e.g., `mock-interview-user`)
5. **Generate a secure password** (save it!)
6. **Set privileges to "Read and write to any database"**
7. **Click "Add User"**

### 4. Configure Network Access

1. **Go to "Network Access"** in the left sidebar
2. **Click "Add IP Address"**
3. **Choose "Allow Access from Anywhere"** (for development)
   - For production, add specific IP addresses
4. **Click "Confirm"**

### 5. Get Your Connection String

1. **Go to "Database"** in the left sidebar
2. **Click "Connect"** on your cluster
3. **Choose "Connect your application"**
4. **Select "Node.js"** as driver
5. **Copy the connection string**

The connection string will look like:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### 6. Update Your Environment File

1. **Open `backend/.env`** in your project
2. **Update the MONGODB_URI** with your connection string:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://mock-interview-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/mock-interview?retryWrites=true&w=majority
```

**Important Notes:**
- Replace `YOUR_PASSWORD` with the actual password you created
- Replace `cluster0.xxxxx` with your actual cluster details
- The database name `mock-interview` will be created automatically

### 7. Test Your Connection

After updating your `.env` file:

1. **Restart your backend server**:
   ```bash
   cd backend
   node server.js
   ```

2. **Test the connection**:
   ```bash
   curl http://localhost:5000/api/test/db-status
   ```

## 📊 Database Collections

Your app will automatically create these collections:

### `users` Collection
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

### `interviews` Collection
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
    overallScore: Number,
    categoryScores: [Object]
  },
  status: String, // 'draft', 'in-progress', 'completed'
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 Troubleshooting

### Connection Issues

**Error: "MongoServerSelectionError"**
- Check your internet connection
- Verify the connection string is correct
- Ensure your IP address is whitelisted

**Error: "Authentication failed"**
- Verify username and password
- Check if the user has proper permissions

**Error: "Network timeout"**
- Check if your firewall is blocking the connection
- Try connecting from a different network

### Testing Connection

Use these endpoints to test your MongoDB Atlas connection:

```bash
# Check database status
GET http://localhost:5000/api/test/db-status

# Create a test document
POST http://localhost:5000/api/test/test-create

# Read test documents
GET http://localhost:5000/api/test/test-read
```

## 🚀 Production Considerations

### Security
- Use specific IP addresses instead of "Allow from anywhere"
- Create dedicated database users with minimal permissions
- Enable MongoDB Atlas security features

### Performance
- Upgrade to a paid tier for better performance
- Use connection pooling
- Monitor query performance

### Backup
- MongoDB Atlas provides automatic backups
- Configure backup retention policies
- Test restore procedures

## 📈 Monitoring

MongoDB Atlas provides built-in monitoring:
- **Metrics**: CPU, memory, disk usage
- **Logs**: Database and application logs
- **Alerts**: Set up notifications for issues

## 🆘 Support

If you encounter issues:
1. Check the MongoDB Atlas documentation
2. Review the troubleshooting section above
3. Check your connection string format
4. Verify your network access settings

## ✅ Success Indicators

You'll know MongoDB Atlas is working when:
- ✅ Backend server starts without connection errors
- ✅ Database status shows "connected"
- ✅ Test documents can be created and read
- ✅ User registration works
- ✅ Interview data is saved and retrieved

---

**Next Steps**: Once MongoDB Atlas is configured, your Mock Interview Web App will be able to:
- Store user accounts and profiles
- Save interview questions and answers
- Generate and store AI feedback
- Track interview progress and history

Your data will be safely stored in the cloud and accessible from anywhere! 🌐
