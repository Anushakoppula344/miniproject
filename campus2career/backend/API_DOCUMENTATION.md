# Campus2Career Admin Dashboard Backend API

## Overview
Complete backend API for the Campus2Career admin dashboard, providing CRUD operations for companies, job roles, and workflows management.

## Base URL
```
http://localhost:5000/api
```

## Authentication
All admin routes require authentication. Include JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Companies Management

#### GET /companies
Get all companies with optional filtering
- **Query Parameters:**
  - `search` (string): Search by name, description, or location
  - `industry` (string): Filter by industry
  - `companySize` (string): Filter by company size
- **Response:** Array of company objects

#### GET /companies/:id
Get company by ID
- **Response:** Single company object

#### POST /companies
Create new company
- **Body:** Company object with required fields
- **Required Fields:** name, industry, location, website, companySize, description

#### PUT /companies/:id
Update company
- **Body:** Updated company object

#### DELETE /companies/:id
Delete company and all associated data
- **Response:** Success message

#### POST /companies/:id/documents
Upload PDF document for company
- **Body:** FormData with 'document' file and 'type' field
- **File Types:** PDF only
- **Max Size:** 10MB

#### DELETE /companies/:id/documents/:docId
Delete company document
- **Response:** Success message

#### GET /companies/:id/documents/:docId/download
Download company document
- **Response:** File download

### Job Roles Management

#### GET /job-roles
Get all job roles with optional filtering
- **Query Parameters:**
  - `search` (string): Search by title, description, or location
  - `company` (string): Filter by company name
  - `level` (string): Filter by job level
- **Response:** Array of job role objects

#### GET /job-roles/active
Get only active job roles (registration date >= today)
- **Response:** Array of active job role objects

#### GET /job-roles/:id
Get job role by ID
- **Response:** Single job role object

#### POST /job-roles
Create new job role
- **Body:** Job role object with required fields
- **Required Fields:** title, company, level, type, location, salary, description, registrationLastDate

#### PUT /job-roles/:id
Update job role
- **Body:** Updated job role object

#### DELETE /job-roles/:id
Delete job role
- **Response:** Success message

#### GET /job-roles/company/:companyName
Get job roles by company
- **Response:** Array of job role objects

#### PUT /job-roles/:id/status
Update job role status based on registration date
- **Response:** Updated job role object

#### POST /job-roles/bulk-status-update
Update status for all job roles
- **Response:** Success message

### Workflows Management

#### GET /workflows
Get all workflows with optional filtering
- **Query Parameters:**
  - `search` (string): Search by name or description
  - `company` (string): Filter by company name
  - `difficulty` (string): Filter by difficulty level
- **Response:** Array of workflow objects

#### GET /workflows/:id
Get workflow by ID
- **Response:** Single workflow object

#### POST /workflows
Create new workflow
- **Body:** Workflow object with required fields
- **Required Fields:** name, company, description, difficulty, stages

#### PUT /workflows/:id
Update workflow
- **Body:** Updated workflow object

#### DELETE /workflows/:id
Delete workflow
- **Response:** Success message

#### POST /workflows/:id/stages
Add stage to workflow
- **Body:** Stage object with name, duration, type, order

#### DELETE /workflows/:id/stages/:order
Remove stage from workflow
- **Response:** Updated workflow object

#### PUT /workflows/:id/stages/reorder
Reorder workflow stages
- **Body:** { newOrder: [array of order numbers] }

#### GET /workflows/company/:companyName
Get workflows by company
- **Response:** Array of workflow objects

#### GET /workflows/difficulty/:difficulty
Get workflows by difficulty
- **Response:** Array of workflow objects

#### PUT /workflows/:id/toggle-status
Toggle workflow active status
- **Response:** Updated workflow object

## Data Models

### Company
```json
{
  "name": "string",
  "industry": "Technology|Finance|Healthcare|E-commerce|Manufacturing",
  "location": "string",
  "website": "string",
  "companySize": "1-50|51-200|201-1000|1000+",
  "description": "string",
  "hiringStatus": "Active|Inactive",
  "documents": [
    {
      "id": "string",
      "name": "string",
      "type": "Question Paper|Interview Report|Other",
      "size": "number",
      "uploadedAt": "date"
    }
  ],
  "roles": "number",
  "workflows": "number",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### JobRole
```json
{
  "title": "string",
  "company": "string",
  "level": "Entry-Level|Mid-Level|Senior|Lead",
  "type": "Full-time|Part-time|Contract|Internship",
  "location": "string",
  "salary": {
    "min": "number",
    "max": "number",
    "currency": "string"
  },
  "description": "string",
  "requirements": ["string"],
  "responsibilities": ["string"],
  "skills": ["string"],
  "registrationLastDate": "date",
  "status": "Active|Inactive",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Workflow
```json
{
  "name": "string",
  "company": "string",
  "description": "string",
  "difficulty": "Low|Medium|High",
  "stages": [
    {
      "name": "string",
      "duration": "string",
      "type": "Phone|Video|In-person|Panel|Screening",
      "order": "number",
      "description": "string"
    }
  ],
  "totalDuration": "string",
  "isActive": "boolean",
  "createdAt": "date",
  "updatedAt": "date"
}
```

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## File Upload
- **Supported Types:** PDF only
- **Max Size:** 10MB
- **Storage:** Local filesystem in `uploads/companies/` directory
- **Access:** Files served at `/uploads/` endpoint

## Database Features
- **Auto Status Updates:** Job roles automatically update status based on registration date
- **Statistics Tracking:** Company stats (roles, workflows) automatically calculated
- **Cascade Deletion:** Deleting company removes all associated job roles and workflows
- **File Management:** Automatic cleanup of uploaded files when documents are deleted

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create `.env` file with:
   ```
   MONGODB_URI=mongodb://localhost:27017/mock-interview
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   JWT_SECRET=your-secret-key
   ```

3. **Start Server:**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

4. **Seed Database (Optional):**
   ```bash
   node seed.js
   ```

## Testing
Use the health check endpoint to verify server status:
```
GET /api/health
```

This will return server status and available endpoints.
