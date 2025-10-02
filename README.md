# Clinical Copilot - AI-Powered Electronic Health Records System

A comprehensive healthcare management system that leverages artificial intelligence to streamline electronic health records, patient management, and clinical decision support.

## 🏥 Overview

Clinical Copilot is a modern, AI-enhanced healthcare management platform designed to improve clinical workflows, reduce documentation time, and enhance patient care through intelligent automation and insights.

### Key Features

- **AI-Powered Patient Summaries**: Generate comprehensive patient summaries using OpenAI GPT-4o-mini
- **Speech-to-Text Integration**: Dictate patient information using OpenAI Whisper API
- **Intelligent Chat Assistant**: Get AI insights about patient data and medical conditions
- **Comprehensive Patient Management**: Complete CRUD operations for patient records
- **Medical Report Generation**: Automated discharge, handover, and referral reports
- **Real-time Dashboard**: Monitor patient status and key metrics
- **Responsive Design**: Modern, mobile-friendly interface

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   AI Services   │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (OpenAI)      │
│                 │    │                 │    │                 │
│ • Patient UI    │    │ • REST API      │    │ • GPT-4o-mini   │
│ • Dashboard     │    │ • MongoDB       │    │ • Whisper API   │
│ • Speech Input  │    │ • Data Models   │    │ • Text Analysis │
│ • Reports       │    │ • Authentication│    │ • Summaries     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- OpenAI API Key
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LLM-based-Clinical-Copilot-A-Generative-AI-Solution-for-Streamlining-Electronic-Health-Records
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd server
   npm install
   
   # Install frontend dependencies
   cd ../my-react-app
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Backend environment
   cd server
   cp .env.example .env
   # Edit .env with your MongoDB connection string
   
   # Frontend environment
   cd ../my-react-app
   cp .env.example .env
   # Edit .env with your OpenAI API key
   ```

4. **Start the application**
   ```bash
   # Terminal 1: Start backend
   cd server
   npm start
   
   # Terminal 2: Start frontend
   cd my-react-app
   npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## 📁 Project Structure

```
clinical-copilot/
├── server/                     # Backend API
│   ├── src/
│   │   ├── controllers/        # API route handlers
│   │   ├── models/            # Database models
│   │   ├── routes/            # API routes
│   │   ├── seed/              # Database seeding
│   │   └── server.js          # Main server file
│   ├── package.json
│   └── .env
├── my-react-app/              # Frontend Application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── ai/           # AI-related components
│   │   │   ├── chat/         # Chat interface
│   │   │   ├── dashboard/    # Dashboard components
│   │   │   ├── forms/        # Form components
│   │   │   ├── reports/      # Report components
│   │   │   └── ui/           # UI components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   └── utils/            # Utility functions
│   ├── package.json
│   └── .env
└── README.md
```

## 🔧 Backend (Node.js + Express + MongoDB)

### Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (planned)
- **API**: RESTful API design

### API Endpoints

#### Patient Management
```
GET    /api/patients           # Get all patients
GET    /api/patients/:id       # Get patient by ID
POST   /api/patients           # Create new patient
PUT    /api/patients/:id       # Update patient
DELETE /api/patients/:id       # Delete patient
```

#### Example API Usage
```javascript
// Get all patients
fetch('http://localhost:5001/api/patients')
  .then(response => response.json())
  .then(data => console.log(data));

// Create new patient
fetch('http://localhost:5001/api/patients', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    first_name: 'John',
    last_name: 'Doe',
    medical_record_number: 'MRN-001',
    // ... other fields
  })
});
```

### Database Schema

#### Patient Model
```javascript
{
  first_name: String (required),
  last_name: String (required),
  medical_record_number: String (required, unique),
  date_of_birth: Date,
  gender: String,
  phone: String,
  email: String,
  address: String,
  status: String (enum: ['active', 'inactive', 'discharged']),
  chief_complaint: String,
  medical_history: String,
  current_medications: String,
  allergies: String,
  symptoms: String,
  diagnosis: String,
  treatment_plan: String,
  ai_summary: Boolean,
  ai_summary_content: String,
  vital_signs: {
    blood_pressure: String,
    heart_rate: Number,
    temperature: Number,
    weight: Number,
    height: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Environment Variables

```env
# server/.env
MONGODB_URI=mongodb://localhost:27017/clinicaldb
PORT=5001
NODE_ENV=development
```

## 🎨 Frontend (React + Tailwind CSS)

### Technology Stack

- **Framework**: React 19.1.1
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Routing**: React Router DOM

### Key Components

#### 1. Dashboard (`src/pages/Dashboard.jsx`)
- Patient overview cards
- Quick statistics
- Recent activity feed
- Search and filter functionality

#### 2. Patient Management
- **PatientForm** (`src/components/forms/PatientForm.jsx`): Create/edit patient records
- **PatientCard** (`src/components/dashboard/PatientCard.jsx`): Patient summary cards
- **PatientDetail** (`src/pages/PatientDetail.jsx`): Detailed patient view

#### 3. AI Features
- **AIAssistant** (`src/pages/AIAssistant.jsx`): Chat interface for AI queries
- **SummaryGenerator** (`src/components/ai/SummaryGenerator.jsx`): AI-powered patient summaries
- **SpeechInput** (`src/components/ui/SpeechInput.jsx`): Speech-to-text functionality

#### 4. Reports
- **DischargeReport** (`src/components/reports/DischargeReport.jsx`)
- **HandoverReport** (`src/components/reports/HandoverReport.jsx`)
- **ReferralReport** (`src/components/reports/ReferralReport.jsx`)

### Environment Variables

```env
# my-react-app/.env
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
```

## 🤖 AI Integration

### OpenAI Services

#### 1. GPT-4o-mini Integration (`src/services/OpenAIService.js`)

**Patient Summary Generation**
```javascript
import { generatePatientSummary } from '../services/OpenAIService';

const summary = await generatePatientSummary(patient);
```

**AI Chat Assistant**
```javascript
import { generatePatientInsights } from '../services/OpenAIService';

const response = await generatePatientInsights(patients, userQuestion);
```

#### 2. Whisper Speech-to-Text (`src/services/SpeechToTextService.js`)

**Audio Transcription**
```javascript
import { transcribeAudio } from '../services/SpeechToTextService';

const transcription = await transcribeAudio(audioBlob, 'en');
```

**Recording Management**
```javascript
import { startRecording, stopRecording } from '../services/SpeechToTextService';

const mediaRecorder = await startRecording(onDataAvailable, onError);
// ... recording logic
stopRecording(mediaRecorder);
```

### AI Features

#### 1. Patient Summaries
- **Automatic Generation**: AI creates comprehensive patient summaries
- **Medical Context**: Includes diagnosis, treatment, and clinical insights
- **Editable Content**: Healthcare providers can review and modify
- **Persistent Storage**: Summaries are saved to the database

#### 2. Chat Assistant
- **Natural Language Queries**: Ask questions about patient data
- **Clinical Insights**: Get AI-powered analysis of patient conditions
- **Quick Prompts**: Pre-defined queries for common tasks
- **Real-time Responses**: Instant AI-generated answers

#### 3. Speech-to-Text
- **Voice Input**: Dictate patient information instead of typing
- **Smart Formatting**: Automatic formatting for names, phone numbers, etc.
- **Multi-language Support**: Supports multiple languages via Whisper
- **Real-time Processing**: Live transcription as you speak

## 📊 Features Overview

### Patient Management
- ✅ Create, read, update, delete patient records
- ✅ Comprehensive patient information forms
- ✅ Medical history tracking
- ✅ Vital signs monitoring
- ✅ Status management (active, inactive, discharged)

### AI-Powered Features
- ✅ Automated patient summaries
- ✅ Intelligent chat assistant
- ✅ Speech-to-text input
- ✅ Clinical insights and analysis
- ✅ Medical report generation

### User Interface
- ✅ Modern, responsive design
- ✅ Dark/light theme support
- ✅ Mobile-friendly interface
- ✅ Smooth animations and transitions
- ✅ Accessible components

### Data Management
- ✅ MongoDB database integration
- ✅ Real-time data synchronization
- ✅ Data validation and error handling
- ✅ Backup and recovery support

## 🔒 Security Considerations

### Data Protection
- Patient data encryption in transit
- Secure API endpoints
- Input validation and sanitization
- CORS configuration

### Privacy Compliance
- HIPAA-compliant data handling
- Patient data anonymization options
- Audit logging capabilities
- Data retention policies

## 🚀 Deployment

### Development
```bash
# Backend
cd server
npm run dev

# Frontend
cd my-react-app
npm start
```

### Production
```bash
# Build frontend
cd my-react-app
npm run build

# Start production server
cd server
npm start
```

### Docker Deployment (Optional)
```dockerfile
# Dockerfile for backend
FROM node:16
WORKDIR /app
COPY server/package*.json ./
RUN npm install
COPY server/ .
EXPOSE 5001
CMD ["npm", "start"]
```

## 🧪 Testing

### Backend Testing
```bash
cd server
npm test
```

### Frontend Testing
```bash
cd my-react-app
npm test
```

### API Testing
```bash
# Test patient endpoints
curl http://localhost:5001/api/patients

# Test AI summary generation
curl -X POST http://localhost:5001/api/patients/:id/summary
```

## 📈 Performance Optimization

### Frontend
- Code splitting and lazy loading
- Image optimization
- Bundle size optimization
- Caching strategies

### Backend
- Database indexing
- Query optimization
- Caching middleware
- Rate limiting

### AI Services
- Request batching
- Response caching
- Error handling and retries
- Cost optimization

## 🔧 Configuration

### Backend Configuration
```javascript
// server/src/config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ DB connected to:', mongoose.connection.name);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};
```

### Frontend Configuration
```javascript
// my-react-app/src/config/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export const apiClient = {
  get: (endpoint) => fetch(`${API_BASE_URL}${endpoint}`),
  post: (endpoint, data) => fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
};
```

## 🐛 Troubleshooting

### Common Issues

#### 1. OpenAI API Errors
```bash
# Check API key
echo $REACT_APP_OPENAI_API_KEY

# Verify API key in browser console
console.log(process.env.REACT_APP_OPENAI_API_KEY);
```

#### 2. Database Connection Issues
```bash
# Check MongoDB status
mongod --version

# Test connection
mongo --eval "db.adminCommand('ismaster')"
```

#### 3. CORS Issues
```javascript
// server/src/server.js
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### Debug Mode
```bash
# Backend debug
DEBUG=* npm start

# Frontend debug
REACT_APP_DEBUG=true npm start
```

## 📚 API Documentation

### Authentication
```javascript
// Future implementation
const token = localStorage.getItem('authToken');
fetch('/api/patients', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Error Handling
```javascript
// Standard error response format
{
  "error": "Validation Error",
  "message": "Medical record number is required",
  "status": 400
}
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Style
- ESLint configuration
- Prettier formatting
- Conventional commits
- TypeScript (future)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Documentation
- API Documentation: `/docs/api`
- Component Library: `/docs/components`
- Deployment Guide: `/docs/deployment`

### Contact
- Issues: GitHub Issues
- Discussions: GitHub Discussions
- Email: support@clinicalcopilot.com

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ Basic patient management
- ✅ AI-powered summaries
- ✅ Speech-to-text integration
- ✅ Chat assistant

### Phase 2 (Planned)
- 🔄 User authentication and authorization
- 🔄 Advanced reporting features
- 🔄 Mobile application
- 🔄 Integration with EHR systems

### Phase 3 (Future)
- 📋 Machine learning models
- 📋 Predictive analytics
- 📋 Telemedicine features
- 📋 Multi-tenant support

---

**Built with ❤️ for healthcare professionals**

*This application is designed to improve clinical workflows and patient care through the power of artificial intelligence.*