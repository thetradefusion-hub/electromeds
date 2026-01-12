# ElectroMed - AI-Powered Electro Homeopathy Clinic Management SaaS

> India's First AI-Powered Electro Homeopathy Clinic Management Platform

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Git

### Local Development

```bash
# Clone the repository
git clone https://github.com/thetradefusion-hub/electromeds.git
cd electromeds

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Set up environment variables
# Frontend: Create .env file with VITE_API_URL=http://localhost:5000/api
# Backend: Create backend/.env file (see backend/.env.example)

# Start backend (from backend directory)
npm run dev

# Start frontend (from root directory)
npm run dev
```

Frontend: http://localhost:8080  
Backend: http://localhost:5000

## 📦 Deployment

### Quick Deploy (5 minutes)
See [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) for fast deployment guide.

### Detailed Deployment Guide
See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete step-by-step instructions.

**Deployment Platforms:**
- **Frontend**: Vercel (recommended)
- **Backend**: Railway (recommended)
- **Database**: MongoDB Atlas or Railway MongoDB

## 🏗️ Project Structure

```
electromed/
├── backend/          # Node.js + Express + MongoDB API
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── middleware/
│   └── package.json
├── src/              # React + TypeScript Frontend
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── lib/
├── public/
└── package.json
```

## 🎯 Features

- ✅ **Patient Management** - Complete patient records and history
- ✅ **Prescription Management** - Digital prescriptions with PDF generation
- ✅ **AI-Powered Analysis** - Medical report analysis with multiple AI providers
- ✅ **Appointment Scheduling** - Smart appointment management
- ✅ **Staff Management** - Role-based staff assignment
- ✅ **Analytics Dashboard** - Comprehensive clinic analytics
- ✅ **Subscription Plans** - 3-tier SaaS pricing
- ✅ **Electro Homeopathy Data** - 110 symptoms, 96 medicines, 50 rules pre-loaded
- ✅ **Multi-language** - English & Hindi support
- ✅ **WhatsApp Integration** - Share prescriptions via WhatsApp

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS + Shadcn UI
- TanStack Query
- React Router DOM

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- TypeScript

## 📚 Documentation

- [Project Overview](./PROJECT_OVERVIEW.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Quick Deploy](./QUICK_DEPLOY.md)
- [Competitor Analysis](./COMPETITOR_ANALYSIS_INDIA.md)
- [Enhancement Roadmap](./ENHANCEMENT_ROADMAP.md)
- [Backend API Docs](./backend/docs/API_ENDPOINTS.md)

## 🔐 Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

### Backend (backend/.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/electromed
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:8080
```

See `backend/.env.example` for complete list.

## 📝 License

ISC

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ for Electro Homeopathy Practitioners**
