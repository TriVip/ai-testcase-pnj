# AI Test Case Generator 🚀

A full-stack AI-powered test case and test plan management system with Google OAuth authentication and OpenAI integration.

## Features ✨

- 🔐 **Google OAuth Authentication** - Secure login with Gmail
- 📝 **Test Case Management** - Create, edit, delete, and organize test cases
- 📋 **Test Plan Management** - Group test cases into comprehensive test plans
- 🤖 **AI-Powered Suggestions** - Generate test cases automatically using OpenAI
- 📊 **XLSX Export** - Export test cases to Excel format
- 🎨 **Modern UI** - Beautiful interface built with Tailwind CSS

## Tech Stack 💻

### Frontend
- **Vite** - Fast build tool
- **React** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **XLSX** - Excel file generation

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Passport.js** - Authentication middleware
- **OpenAI API** - AI-powered suggestions
- **JWT** - Token-based authentication

## Prerequisites 📋

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB (local or Atlas)
- Google OAuth credentials
- OpenAI API key

## Setup Instructions 🛠️

### 1. Clone and Install

```bash
cd ai-testcase-gen
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

- **MongoDB URI**: Your MongoDB connection string
- **Google OAuth**: Client ID and Secret from [Google Cloud Console](https://console.cloud.google.com/)
- **OpenAI API Key**: From [OpenAI Platform](https://platform.openai.com/)
- **JWT Secret**: Generate a random secure string

### 3. Setup Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

### 4. Setup MongoDB

**Option A: MongoDB Atlas (Recommended)**
1. Create free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string and add to `.env`

**Option B: Local MongoDB**
1. Install MongoDB locally
2. Start MongoDB service
3. Use `mongodb://localhost:27017/testcase-gen` in `.env`

### 5. Run the Application

```bash
# Run both frontend and backend
npm run dev

# Or run separately
npm run dev:backend  # Backend on http://localhost:5000
npm run dev:frontend # Frontend on http://localhost:5173
```

## Project Structure 📁

```
ai-testcase-gen/
├── frontend/          # Vite + React + Tailwind
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── backend/           # Express.js + MongoDB
│   ├── src/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── config/
│   └── package.json
├── shared/            # Shared types and utilities
└── package.json       # Root workspace config
```

## API Endpoints 🔌

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/logout` - Logout user
- `GET /api/auth/current` - Get current user

### Test Cases
- `GET /api/testcases` - Get all test cases
- `POST /api/testcases` - Create test case
- `GET /api/testcases/:id` - Get single test case
- `PUT /api/testcases/:id` - Update test case
- `DELETE /api/testcases/:id` - Delete test case

### Test Plans
- `GET /api/testplans` - Get all test plans
- `POST /api/testplans` - Create test plan
- `GET /api/testplans/:id` - Get single test plan
- `PUT /api/testplans/:id` - Update test plan
- `DELETE /api/testplans/:id` - Delete test plan

### AI
- `POST /api/ai/suggest-testcases` - Generate AI test case suggestions

## Development 👨‍💻

```bash
# Install dependencies for all workspaces
npm run install:all

# Run development servers
npm run dev

# Access the application
# Frontend: http://localhost:5173
# Backend: http://localhost:5000
```

## License 📄

MIT
