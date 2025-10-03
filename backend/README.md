# Campus2Career Backend API

A Node.js + Express backend server for storing user data with MongoDB Atlas integration.

## Features

- **Express.js** server with RESTful API endpoints
- **MongoDB Atlas** integration with Mongoose ODM
- **User Management** with full CRUD operations
- **Authentication** with JWT tokens and bcrypt password hashing
- **Error Handling** with comprehensive JSON responses
- **Environment Variables** for secure configuration
- **Development Mode** with in-memory database fallback

## Database Schema

### Users Collection
The `users` collection stores the following fields:
- `name` (String, required) - User's full name
- `email` (String, required, unique) - User's email address
- `password` (String, required) - Hashed password
- `role` (String, required) - User role: "student" or "admin" (default: "student")
- `createdAt` (Date) - Timestamp of user creation

## API Endpoints

### User Management

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `GET` | `/users` | Get all users | None |
| `GET` | `/users/:id` | Get user by ID | None |
| `POST` | `/users` | Create new user | `{ name, email, password, role? }` |
| `PUT` | `/users/:id` | Update user | `{ name?, email?, password?, role? }` |
| `DELETE` | `/users/:id` | Delete user | None |

### Authentication

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `POST` | `/auth/sign-up` | Register new user | `{ name, email, password }` |
| `POST` | `/auth/sign-in` | Login user | `{ email, password }` |
| `GET` | `/auth/me` | Get current user | None (requires auth token) |

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account and cluster

### 1. Clone and Install Dependencies

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```bash
# Copy the example file
cp .env.example .env
```

Edit the `.env` file with your MongoDB Atlas credentials:

```env
# MongoDB Atlas Connection String
# Replace <cluster-url> with your actual cluster URL
MONGODB_URI=mongodb+srv://campus2career_user:2131@<cluster-url>/campus2career?retryWrites=true&w=majority

JWT_SECRET=campus2career_jwt_secret_key_2024
PORT=5000

# Set to false to use MongoDB Atlas instead of in-memory database
USE_MEMORY_DB=false
```

### 3. MongoDB Atlas Setup

1. **Create MongoDB Atlas Account**: Visit [MongoDB Atlas](https://www.mongodb.com/atlas) and create an account
2. **Create Cluster**: Create a new cluster (free tier available)
3. **Database Access**: Create a database user with username `campus2career_user` and password `2131`
4. **Network Access**: Add your IP address to the whitelist (or use 0.0.0.0/0 for development)
5. **Get Connection String**: Replace `<cluster-url>` in your `.env` file with your actual cluster URL

### 4. Run the Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

## Usage Examples

### Create a New User

```bash
curl -X POST http://localhost:5000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123",
    "role": "student"
  }'
```

### Get All Users

```bash
curl http://localhost:5000/users
```

### Get User by ID

```bash
curl http://localhost:5000/users/USER_ID_HERE
```

### Update User

```bash
curl -X PUT http://localhost:5000/users/USER_ID_HERE \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "role": "admin"
  }'
```

### Delete User

```bash
curl -X DELETE http://localhost:5000/users/USER_ID_HERE
```

## Response Format

All API responses follow this JSON format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ },
  "count": 10  // Only for list endpoints
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Development Features

### In-Memory Database Mode
For development without MongoDB Atlas, set `USE_MEMORY_DB=true` in your `.env` file. This will use an in-memory storage system.

### Debug Endpoints
- `GET /auth/debug/users` - View all users (development only)

## Security Features

- **Password Hashing**: Uses bcrypt with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Validates required fields and data types
- **Error Handling**: Comprehensive error responses without exposing sensitive data
- **Environment Variables**: Secure configuration management

## Error Handling

The API handles various error scenarios:
- **400 Bad Request**: Invalid input data, duplicate emails, invalid user ID format
- **404 Not Found**: User not found
- **500 Internal Server Error**: Database connection issues, server errors

## Dependencies

- **express**: Web framework for Node.js
- **mongoose**: MongoDB object modeling for Node.js
- **bcryptjs**: Password hashing library
- **jsonwebtoken**: JWT implementation
- **cors**: Cross-Origin Resource Sharing middleware
- **dotenv**: Environment variable loader

## Scripts

- `npm start`: Start the server in production mode
- `npm run dev`: Start the server in development mode with nodemon
- `npm test`: Run tests (placeholder)

## Project Structure

```
backend/
├── models/
│   ├── User.js          # User schema definition
│   ├── Interview.js     # Interview schema
│   └── Feedback.js      # Feedback schema
├── routes/
│   ├── users.js         # User CRUD operations
│   ├── auth.js          # Authentication routes
│   ├── interviews.js    # Interview routes
│   └── feedback.js      # Feedback routes
├── middleware/
│   └── auth.js          # JWT authentication middleware
├── server.js            # Main server file
├── package.json         # Dependencies and scripts
├── .env.example         # Environment variables template
└── README.md           # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.