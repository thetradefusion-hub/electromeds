# ElectroMed Backend API

Express + MongoDB backend for ElectroMed medical practice management system.

## 🚀 Features

- **Express.js** - Fast, unopinionated web framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT Authentication** - Secure token-based authentication
- **TypeScript** - Type-safe development
- **Role-Based Access Control** - Super Admin, Doctor, Staff roles
- **RESTful API** - Clean API endpoints

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## 🔧 Installation

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Create `.env` file:**
```bash
cp .env.example .env
```

3. **Configure environment variables in `.env`:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/electromed
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:8080
```

## 🏃 Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

Server will run on `http://localhost:5000`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get single patient
- `POST /api/patients` - Create patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient
- `PATCH /api/patients/:id/visit` - Record visit

### Prescriptions
- `GET /api/prescriptions` - Get all prescriptions
- `GET /api/prescriptions/:id` - Get single prescription
- `POST /api/prescriptions` - Create prescription
- `PUT /api/prescriptions/:id` - Update prescription
- `DELETE /api/prescriptions/:id` - Delete prescription

### Medicines
- `GET /api/medicines` - Get all medicines
- `GET /api/medicines/:id` - Get single medicine
- `POST /api/medicines` - Create medicine
- `PUT /api/medicines/:id` - Update medicine
- `DELETE /api/medicines/:id` - Delete medicine

### Symptoms
- `GET /api/symptoms` - Get all symptoms
- `GET /api/symptoms/:id` - Get single symptom
- `POST /api/symptoms` - Create symptom
- `PUT /api/symptoms/:id` - Update symptom
- `DELETE /api/symptoms/:id` - Delete symptom

## 🔐 Authentication

All protected routes require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── server.ts        # Entry point
├── dist/                # Compiled JavaScript
├── .env                 # Environment variables
├── package.json
└── tsconfig.json
```

## 🛠️ Development

- **TypeScript** - Type checking and compilation
- **ESLint** - Code linting
- **tsx** - TypeScript execution for development

## 📝 Notes

- MongoDB connection is established automatically on server start
- JWT tokens expire after 7 days (configurable)
- All routes are protected except `/api/auth/signup` and `/api/auth/login`
- Role-based access control is implemented for different user types

