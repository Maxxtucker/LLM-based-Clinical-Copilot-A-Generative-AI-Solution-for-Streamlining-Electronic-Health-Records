# Code Structure Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Backend Structure](#backend-structure)
4. [Frontend Structure](#frontend-structure)
5. [Key Files and Their Functions](#key-files-and-their-functions)
6. [Data Flow](#data-flow)

---

## Project Overview

This is a **Clinical Copilot Application** - a comprehensive Electronic Health Records (EHR) system with AI-powered features for healthcare professionals. The application provides:

- Patient management (CRUD operations)
- Visit and checkup tracking
- AI-powered patient summaries with longitudinal analysis
- RAG (Retrieval Augmented Generation) for intelligent patient queries
- Medical report generation
- Speech-to-text transcription for clinical notes
- Vector search for similar patients

### Tech Stack
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), OpenAI API
- **Frontend**: React 19, CRACO (Create React App Configuration Override), TailwindCSS
- **AI/ML**: OpenAI GPT-4, HuggingFace Transformers, Vector Embeddings

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                      │
│  ┌──────────┬──────────┬──────────┬──────────┬───────────┐  │
│  │ Patients │    AI    │ Reports  │  Speech  │   Auth    │  │
│  │  Module  │  Module  │  Module  │  Module  │  Module   │  │
│  └──────────┴──────────┴──────────┴──────────┴───────────┘  │
│                           ↓ HTTP/REST API                     │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Express.js)                       │
│  ┌──────────┬──────────┬──────────┬──────────┬───────────┐  │
│  │ Patients │    AI    │   RAG    │ Reports  │  Speech   │  │
│  │  Module  │  Module  │  Module  │  Module  │  Module   │  │
│  └──────────┴──────────┴──────────┴──────────┴───────────┘  │
│                           ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Core Services                           │   │
│  │  • Database Config  • Utils  • Middleware            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│  ┌──────────┬──────────┬──────────┬──────────────────────┐  │
│  │ MongoDB  │  OpenAI  │HuggingFace│  Vector Embeddings  │  │
│  └──────────┴──────────┴──────────┴──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend Structure

### Directory Layout
```
backend/
├── src/
│   ├── core/                    # Core infrastructure
│   │   ├── config/
│   │   │   └── db.js           # MongoDB connection setup
│   │   ├── middleware/
│   │   │   ├── errorHandler.js # Global error handling
│   │   │   └── notFound.js     # 404 handler
│   │   └── utils/
│   │       ├── asyncHandler.js # Async error wrapper
│   │       └── date.js         # Date utilities
│   │
│   ├── modules/                # Feature modules (modular architecture)
│   │   ├── patients/          # Patient management module
│   │   ├── ai/                # AI services module
│   │   ├── rag/               # RAG (Retrieval Augmented Generation) module
│   │   ├── reports/           # Report generation module
│   │   └── speech/            # Speech-to-text module
│   │
│   ├── scripts/               # Database scripts & utilities
│   ├── views/                 # Handlebars templates for reports
│   └── server.js              # Main application entry point
│
├── package.json               # Dependencies & scripts
└── .env.example              # Environment variables template
```

### Core Files

#### `src/server.js`
**Purpose**: Main application entry point
- Initializes Express server
- Connects to MongoDB
- Mounts all module routes
- Sets up middleware (CORS, helmet, compression)
- Configures cron jobs for automated tasks
- **Key Routes**:
  - `/api/patients` → Patient CRUD operations
  - `/api/ai` → AI assistant and summary generation
  - `/api/rag` → RAG-based patient search
  - `/api/reports` → Report generation
  - `/api/speech` → Speech transcription

#### `src/core/config/db.js`
**Purpose**: Database connection management
- Connects to MongoDB using Mongoose
- Handles connection errors and retries
- Exports connection instance

---

### Module: Patients (`src/modules/patients/`)

**Purpose**: Complete patient lifecycle management

```
patients/
├── index.js                    # Module exports
├── controllers/
│   └── patient.controller.js  # Request handlers (list, get, create, update, delete)
├── models/
│   ├── patient.model.js       # Patient schema with demographics, vitals, medical history
│   ├── checkup.model.js       # Vital signs checkup schema (time-series data)
│   ├── visit.model.js         # Visit schema (diagnosis, treatment, symptoms)
│   └── appointment.model.js   # Appointment scheduling schema
├── routes/
│   ├── patient.routes.js      # Main patient CRUD routes
│   ├── checkup.routes.js      # Checkup (vitals) routes
│   ├── visit.routes.js        # Visit routes
│   └── legacyVisitBlocker.js  # Blocks deprecated endpoints
└── services/
    └── patient.service.js     # Business logic (search, pagination, validation)
```

#### Key Files:

**`models/patient.model.js`**
- **Purpose**: Defines patient data structure
- **Schema Fields**:
  - Demographics: `first_name`, `last_name`, `date_of_birth`, `gender`, `phone`, `email`
  - Medical: `medical_record_number` (unique), `medical_history`, `allergies`, `current_medications`
  - Clinical: `chief_complaint`, `symptoms`, `diagnosis`, `treatment_plan`
  - Vitals: `vital_signs` (latest snapshot)
  - AI: `ai_summary`, `ai_summary_content`
  - Status: `status` (active/inactive/discharged)
  - References: `last_visit_id`, `last_checkup_id`

**`models/checkup.model.js`**
- **Purpose**: Time-series vital signs data
- **Schema Fields**:
  - `patient_id` (ref to Patient)
  - `date` (checkup date)
  - `vitals`: `bp_sys`, `bp_dia`, `heart_rate`, `temperature_c`, `weight`, `height`
  - `nurse_id` (optional)

**`models/visit.model.js`**
- **Purpose**: Clinical visit documentation
- **Schema Fields**:
  - `patient_id`, `visit_date`
  - `chief_complaint`, `symptoms`, `diagnosis`, `treatment_plan`
  - `checkup_id` (links to vitals taken during visit)

**`controllers/patient.controller.js`**
- **Purpose**: HTTP request handlers
- **Functions**:
  - `list(req, res)` - Get paginated patients with search/filter
  - `get(req, res)` - Get single patient by ID
  - `create(req, res)` - Create new patient
  - `update(req, res)` - Update patient data
  - `remove(req, res)` - Delete patient

**`services/patient.service.js`**
- **Purpose**: Business logic layer
- **Functions**:
  - `searchPatients()` - Search with filters, pagination, sorting
  - `getPatientById()` - Fetch patient by ID
  - `createPatient()` - Validate and create patient
  - `updatePatient()` - Update with validation
  - `deletePatient()` - Soft/hard delete

---

### Module: AI (`src/modules/ai/`)

**Purpose**: AI-powered clinical assistance

```
ai/
├── index.js                    # Module exports
├── controllers/
│   └── ai.controller.js        # AI request handlers
├── routes/
│   ├── ai.routes.js            # Main AI routes (/generate)
│   └── ai-report.routes.js     # Report generation routes
└── services/
    ├── openai.service.js       # OpenAI API integration
    └── promptPlanner.js        # Prompt engineering utilities
```

#### Key Files:

**`controllers/ai.controller.js`**
- **Purpose**: Handle AI-related HTTP requests
- **Functions**:
  - `generateAIResponse()` - General AI chat completion
  - Uses OpenAI GPT-4o-mini for cost-effective responses

**`services/openai.service.js`**
- **Purpose**: OpenAI API wrapper
- **Functions**:
  - `chat()` - Send messages to ChatGPT
  - `generateEmbeddings()` - Create vector embeddings for RAG
  - Handles API errors and retries

---

### Module: RAG (`src/modules/rag/`)

**Purpose**: Retrieval Augmented Generation for intelligent patient queries

```
rag/
├── index.js
├── controllers/
│   └── rag.controller.js       # RAG search handlers
├── routes/
│   └── rag.routes.js           # RAG endpoints
└── services/
    ├── embeddingService.js     # Generate/store patient embeddings
    ├── embeddingScheduler.js   # Automated embedding updates
    ├── vectorSearch.js         # MongoDB Atlas vector search
    └── patientDataAggregator.js # Aggregate patient data for embeddings
```

#### Key Files:

**`services/vectorSearch.js`**
- **Purpose**: Semantic search across patients using vector similarity
- **Functions**:
  - `searchSimilarPatients()` - Find patients similar to query
  - Uses MongoDB Atlas Vector Search with cosine similarity

**`services/embeddingService.js`**
- **Purpose**: Generate embeddings for patient data
- **Functions**:
  - `embedPatient()` - Create embedding for single patient
  - `embedAllPatients()` - Batch embed all patients
  - Converts patient medical data into vector representations

**`services/patientDataAggregator.js`**
- **Purpose**: Prepare patient data for embedding
- **Functions**:
  - `aggregatePatientData()` - Combine demographics, history, visits, vitals
  - Creates comprehensive text representation for embedding

---

### Module: Reports (`src/modules/reports/`)

**Purpose**: Generate clinical reports (discharge, referral, handover)

```
reports/
├── index.js
└── routes/
    ├── report.routes.js        # Report generation API
    ├── report-render.routes.js # HTML report rendering
    └── pdf.routes.js           # PDF export
```

---

### Module: Speech (`src/modules/speech/`)

**Purpose**: Speech-to-text transcription with medical NLP

```
speech/
├── index.js
├── speechController.js         # Handle audio uploads
├── SpeechProcessingService.js  # Process transcribed text
├── MedicalInfoExtractor.js     # Extract clinical entities (NLP)
├── config.js                   # Speech service configuration
└── utils.js                    # Helper functions
```

#### Key Features:
- Transcribes audio using OpenAI Whisper or HuggingFace
- Extracts: vitals, medications, symptoms, allergies, diagnoses
- Uses regex + LLM-based extraction for accuracy

---

### Scripts (`src/scripts/`)

**Purpose**: Database maintenance and utilities

```
scripts/
├── generateMockData.js         # Generate test patient data
├── embedAllPatients.js         # Batch create embeddings
├── createVectorIndex.js        # Setup MongoDB vector index
├── patientMigration.js         # Migrate vitals to checkups
├── visitMigration.js           # Migrate visit data
├── cleanupData.js              # Remove duplicates/old data
└── testEmbedding.js            # Test embedding service
```

---

## Frontend Structure

### Directory Layout
```
frontend/
├── public/                     # Static assets
├── src/
│   ├── app/                    # Application root
│   │   ├── App.js             # Main app component & routing
│   │   ├── App.css            # Global styles
│   │   ├── reportWebVitals.js # Performance monitoring
│   │   └── setupTests.js      # Test configuration
│   │
│   ├── modules/               # Feature modules
│   │   ├── patients/         # Patient management
│   │   ├── ai/               # AI features
│   │   ├── reports/          # Report generation
│   │   ├── speech/           # Speech-to-text
│   │   └── auth/             # Authentication
│   │
│   ├── components/           # Shared UI components
│   │   └── ui/              # Reusable UI elements
│   │
│   ├── shared/              # Shared utilities
│   │   ├── components/      # Shared components
│   │   ├── integrations/    # API integrations
│   │   └── utils/          # Helper functions
│   │
│   ├── index.js            # Application entry point
│   └── index.css           # Global CSS
│
├── craco.config.js         # Webpack configuration override
├── jsconfig.json           # Path aliases configuration
├── tailwind.config.js      # TailwindCSS configuration
└── package.json            # Dependencies & scripts
```

---

### Module: Patients (`src/modules/patients/`)

**Purpose**: Patient management UI

```
patients/
├── pages/
│   ├── Dashboard.jsx           # Patient list with search/filter
│   ├── PatientDetail.jsx       # Individual patient view (visits, vitals, AI summary)
│   ├── EditDetails.jsx         # Edit patient information
│   └── PatientForm.jsx         # Add new patient / record vitals
├── components/
│   ├── dashboard/
│   │   ├── PatientCard.jsx     # Patient list item card
│   │   ├── StatsCards.jsx      # Dashboard statistics
│   │   ├── DateFilter.jsx      # Filter by date range
│   │   └── DateDisplay.jsx     # Format dates
│   └── forms/
│       └── PatientForm.jsx     # Complex patient form with validation
├── services/
│   └── PatientService.ts       # API calls (TypeScript)
└── entities/
    └── Patient.ts              # Patient type definitions
```

#### Key Files:

**`pages/Dashboard.jsx`**
- **Purpose**: Main patient list view
- **Features**:
  - Search by name/MRN
  - Filter by status (active/inactive/discharged)
  - Sorting (name, date)
  - Pagination
  - Quick stats (total patients, active, etc.)

**`pages/PatientDetail.jsx`**
- **Purpose**: Comprehensive patient view
- **Sections**:
  - Demographics
  - Past Visits (chronological list with details)
  - Past Vital Readings (checkups with trends)
  - AI-Generated Summary (with visit history analysis)
  - Speech-to-Text Note Taking
- **Features**:
  - Edit patient info
  - Generate/save AI summary
  - Record voice notes

**`components/forms/PatientForm.jsx`**
- **Purpose**: Nurse workflow - search patient or create new
- **Workflow**:
  1. Search by MRN
  2. If found → Load data, update vitals
  3. If not found → Fill form, create new patient
- **Features**:
  - Real-time validation (email, vitals, BP, heart rate)
  - Warning messages for unusual values
  - Auto-calculate BMI

**`services/PatientService.ts`**
- **Purpose**: Frontend API layer (TypeScript)
- **Functions**:
  - `listPatients()` - Fetch paginated patients
  - `createPatient()` - POST new patient
  - `findPatientByExactMrn()` - Search by MRN
  - `getVisits()` - Fetch patient visits
  - `getCheckups()` - Fetch vital readings
  - `createCheckup()` - POST new vital signs
  - `createVisit()` - POST new visit

---

### Module: AI (`src/modules/ai/`)

**Purpose**: AI-powered features

```
ai/
├── pages/
│   └── AIAssistant.jsx         # Chat interface for AI queries
├── components/
│   ├── SummaryGenerator.jsx    # Generate/edit/save AI summaries
│   ├── ReportPrompt.jsx        # AI-assisted report writing
│   └── chat/
│       ├── ChatInput.jsx       # Message input with send button
│       ├── ChatMessage.jsx     # Individual message display
│       └── QuickPrompts.jsx    # Predefined query buttons
└── services/
    ├── OpenAIService.js        # Direct OpenAI API calls
    └── RAGService.js           # RAG-based patient queries
```

#### Key Files:

**`components/SummaryGenerator.jsx`**
- **Purpose**: AI-powered patient summary with longitudinal analysis
- **Features**:
  - Generate comprehensive summary (fetches last 5 visits + 5 checkups)
  - Edit generated summary
  - Save to patient record
  - Regenerate summary
- **Workflow**:
  1. Click "Generate Summary"
  2. Fetches patient data + visit history + vital trends
  3. Sends to OpenAI with structured prompt
  4. Displays formatted markdown
  5. Click "Save Summary" → Stores in MongoDB

**`services/OpenAIService.js`**
- **Purpose**: Frontend OpenAI integration
- **Functions**:
  - `generatePatientSummary(patient, visits, checkups)` - **NEW**: Creates longitudinal summary
    - Analyzes visit-by-visit progression
    - Calculates vital trends (BP, HR, weight changes)
    - Highlights worsening/improving conditions
    - Provides actionable recommendations
    - Checks for medication-allergy conflicts
  - `generatePatientInsights(patients, query)` - Multi-patient analysis
  - `generateAIResponse(prompt, systemMessage)` - General AI completion

**`services/RAGService.js`**
- **Purpose**: Intelligent patient search using RAG
- **Functions**:
  - `generateRAGPatientInsights(query)` - Search + AI analysis
  - `classifyQuery(query)` - Determine query type
  - Uses vector search to find relevant patients
  - Generates contextual AI responses

**`pages/AIAssistant.jsx`**
- **Purpose**: Chat interface for clinical queries
- **Features**:
  - Natural language queries (e.g., "Show me elderly patients with hypertension")
  - RAG-based responses using similar patients
  - Quick prompt buttons
  - Message history
  - Markdown formatting

---

### Module: Reports (`src/modules/reports/`)

**Purpose**: Clinical report generation

```
reports/
├── pages/
│   ├── ReportGenerator.jsx     # Main report builder
│   └── Reports.jsx             # Report history/templates
├── components/
│   ├── DischargeReport.jsx     # Discharge summary form
│   ├── HandoverReport.jsx      # Handover/shift change report
│   ├── ReferralReport.jsx      # Specialist referral report
│   ├── ReportInput.jsx         # Chat-like input for AI assistance
│   ├── ReportMessage.jsx       # Display AI suggestions
│   └── ReportPrompts.jsx       # Quick report prompts
└── services/
    ├── PDFService.js           # PDF export (jsPDF, html2canvas)
    └── ReportRAGService.js     # AI-assisted report writing
```

---

### Module: Speech (`src/modules/speech/`)

**Purpose**: Voice recording and transcription

```
speech/
├── components/
│   ├── VoiceRecordingButton.jsx # Record audio button
│   └── demo/
│       └── SpeechToTextDemo.jsx # Test speech features
└── services/
    ├── SpeechToTextService.js   # Handle audio upload & transcription
    └── SpeechProcessingService.js # Process transcribed text
```

---

### Module: Auth (`src/modules/auth/`)

**Purpose**: User authentication

```
auth/
└── pages/
    ├── Login.jsx               # Login screen
    └── Profile.jsx             # User profile
```

---

### Shared Components (`src/components/ui/`)

**Purpose**: Reusable UI elements (shadcn/ui inspired)

```
ui/
├── button.jsx                  # Button component
├── card.jsx                    # Card container
├── input.jsx                   # Text input
├── textarea.jsx                # Multi-line input
├── select.jsx                  # Dropdown select
├── label.jsx                   # Form label
├── badge.jsx                   # Status badge
├── calendar.jsx                # Date picker
├── popover.jsx                 # Popover overlay
├── tabs.jsx                    # Tab navigation
├── sidebar.jsx                 # Sidebar navigation
├── confirmdialog.jsx           # Confirmation modal
└── SpeechInput.jsx             # Speech-enabled input
```

---

## Key Files and Their Functions

### Configuration Files

#### `backend/package.json`
```json
{
  "scripts": {
    "start": "node src/server.js",           // Production mode
    "dev": "nodemon src/server.js",          // Development with auto-reload
    "generate-mock-data": "...",             // Generate test data
    "create-vector-index": "...",            // Setup vector search
    "migrate:test": "...",                   // Test migrations
    "migrate:apply": "..."                   // Apply migrations
  },
  "dependencies": {
    "express": "^4.18.2",                    // Web framework
    "mongoose": "^7.8.7",                    // MongoDB ODM
    "openai": "^4.20.1",                     // OpenAI API
    "@huggingface/inference": "^4.13.0",     // HuggingFace models
    "multer": "^2.0.2",                      // File uploads
    "natural": "^8.1.0",                     // NLP library
    "node-cron": "^4.2.1"                    // Scheduled tasks
  }
}
```

#### `frontend/package.json`
```json
{
  "scripts": {
    "start": "craco start",                  // Dev server with CRACO
    "build": "craco build",                  // Production build
    "test": "craco test"                     // Run tests
  },
  "dependencies": {
    "react": "^19.2.0",                      // React library
    "react-router-dom": "^6.26.0",           // Routing
    "openai": "^6.0.1",                      // OpenAI (client-side)
    "framer-motion": "^12.23.12",            // Animations
    "react-markdown": "^10.1.0",             // Markdown rendering
    "chart.js": "^4.5.1",                    // Charts
    "date-fns": "^4.1.0",                    // Date utilities
    "lucide-react": "^0.544.0"               // Icons
  }
}
```

#### `frontend/craco.config.js`
**Purpose**: Customize Create React App webpack configuration
```javascript
{
  webpack: {
    alias: {
      '@': 'src'  // Enable @/ imports (e.g., @/components/ui/button)
    },
    configure: {
      resolve: {
        modules: ['src', '../node_modules'],  // Resolve from workspace root
        extensions: ['.ts', '.tsx', '.js', '.jsx']  // Support TypeScript
      }
    }
  }
}
```

#### `frontend/jsconfig.json`
**Purpose**: Configure path aliases for VS Code IntelliSense
```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/*": ["./*"]  // @/ maps to src/
    }
  }
}
```

---

## Data Flow

### 1. Patient Creation Flow
```
User (Nurse) → PatientForm.jsx → App.js:handlePatientSubmit()
    ↓
1. Search by MRN: findPatientByExactMrn()
    ↓ (if not found)
2. Create Patient: createPatient(payload)
    ↓ POST /api/patients
Backend: patient.controller.create()
    ↓
Backend: patient.service.createPatient()
    ↓
MongoDB: patients collection
    ↓
Response: New patient object
```

### 2. AI Summary Generation Flow
```
User → PatientDetail.jsx → SummaryGenerator.jsx
    ↓ Click "Generate Summary"
1. Fetch visits: getVisits(patientId, 5)
2. Fetch checkups: getCheckups(patientId, 5)
    ↓
3. generatePatientSummary(patient, visits, checkups)
    ↓ Builds comprehensive prompt with:
    - Patient demographics
    - Medical history
    - Visit-by-visit details
    - Vital sign trends
    ↓ POST /api/ai/generate
Backend: ai.controller.generateAIResponse()
    ↓
OpenAI API: GPT-4o-mini
    ↓
Response: Formatted markdown summary
    - Overall status
    - Visit-by-visit analysis
    - Longitudinal trends
    - Medications & allergies
    - Action plan
    - Alerts
    ↓
4. Display summary
5. User clicks "Save Summary"
    ↓ PUT /api/patients/:id { ai_summary_content }
MongoDB: Update patient record
```

### 3. RAG Search Flow
```
User → AIAssistant.jsx → "Find elderly patients with hypertension"
    ↓
RAGService.generateRAGPatientInsights(query)
    ↓ POST /api/rag/search
Backend: rag.controller.searchPatientsRAG()
    ↓
1. Generate query embedding: embeddingService.generateEmbedding(query)
    ↓ OpenAI Embeddings API
2. Vector search: vectorSearch.searchSimilarPatients(embedding)
    ↓ MongoDB Atlas Vector Search (cosine similarity)
3. Return top 5 similar patients
    ↓
4. Build context with patient data
    ↓
5. Generate AI response: openai.chat(context + query)
    ↓ OpenAI GPT-4o-mini
Response: Contextual answer with patient insights
```

### 4. Speech Transcription Flow
```
User → PatientDetail.jsx → VoiceRecordingButton
    ↓ Record audio
1. Capture audio (WebRTC)
    ↓
2. Upload: POST /api/speech/process (multipart/form-data)
    ↓
Backend: speechController.processAudioForPatient()
    ↓
3. Transcribe audio:
   - Try HuggingFace (if HUGGINGFACE_API_KEY set)
   - Fallback: OpenAI Whisper
    ↓ Audio → Text
4. Extract medical entities: MedicalInfoExtractor.extract()
   - Regex patterns for vitals, meds, symptoms
   - LLM-based extraction for complex data
    ↓
5. Update patient record with extracted data
    ↓
MongoDB: Update patient { chief_complaint, symptoms, medications, etc. }
    ↓
Response: Transcribed text + extracted entities
```

---

## Summary of Key Technologies

### Backend
- **Express.js**: REST API framework
- **Mongoose**: MongoDB ODM with schemas
- **OpenAI API**: GPT-4o-mini for AI responses, Whisper for speech
- **HuggingFace**: Alternative models for transcription
- **Node-cron**: Scheduled tasks (embeddings, migrations)
- **Multer**: File upload handling
- **Natural**: NLP library for text processing

### Frontend
- **React 19**: UI framework
- **React Router v6**: Client-side routing
- **CRACO**: Webpack customization without ejecting
- **TailwindCSS**: Utility-first CSS
- **Framer Motion**: Animations
- **React Markdown**: Render AI-generated markdown
- **Chart.js**: Data visualization
- **Lucide React**: Icon library
- **jsPDF + html2canvas**: PDF generation

### Database
- **MongoDB**: NoSQL database
  - Collections: `patients`, `checkups`, `visits`, `patients_embedding`
  - Indexes: `medical_record_number` (unique), vector index for RAG
- **MongoDB Atlas Vector Search**: Semantic search with embeddings

---

## Environment Variables

### Backend `.env`
```
MONGO_URI=mongodb+srv://...               # MongoDB connection string
OPENAI_API_KEY=sk-...                     # OpenAI API key
HUGGINGFACE_API_KEY=hf_...                # (Optional) HuggingFace key
PORT=5001                                 # Server port
FRONTEND_ORIGIN=http://localhost:3000     # CORS origin
USE_IN_MEMORY=false                       # Use in-memory MongoDB for testing
```

### Frontend `.env`
```
REACT_APP_API_BASE_URL=http://localhost:5001  # Backend API URL
REACT_APP_OPENAI_API_KEY=sk-...               # (Optional) Client-side OpenAI
```

---

## Recent Enhancements

### AI Summary with Longitudinal Analysis
**File**: `frontend/src/modules/ai/services/OpenAIService.js`

**New Features**:
1. **Visit History Integration**: Fetches last 5 visits before generating summary
2. **Vital Trends**: Calculates changes in BP, HR, weight over time
3. **Visit-by-Visit Analysis**: Summarizes each visit with key changes
4. **Overall Synthesis**: Provides longitudinal assessment of patient progression
5. **Pattern Recognition**: Identifies concerning trends (worsening conditions)
6. **Medication-Allergy Checking**: Flags potential conflicts

**Output Format**:
- Overall Patient Status (progression summary)
- Visit-by-Visit Analysis (chronological)
- Longitudinal Trends (clinical progress, vital changes, treatment response)
- Current Medical Profile (diagnoses, meds, allergies, risk level)
- Action Plan (immediate actions, follow-up schedule)
- Alerts (safety concerns, red flags)

---

## Development Workflow

### Starting the Application
```bash
# Terminal 1: Start Backend
cd backend
npm run dev         # Runs on http://localhost:5001

# Terminal 2: Start Frontend
cd frontend
npm start          # Runs on http://localhost:3000
```

### Database Scripts
```bash
cd backend

# Generate test data
npm run generate-mock-data

# Create vector index for RAG
npm run create-vector-index

# Run migrations
npm run migrate:test    # Dry run
npm run migrate:apply   # Apply changes
```

### Adding a New Feature Module

1. **Backend**:
```
backend/src/modules/newfeature/
├── index.js                 # Export router
├── controllers/
│   └── newfeature.controller.js
├── routes/
│   └── newfeature.routes.js
├── models/
│   └── newfeature.model.js
└── services/
    └── newfeature.service.js
```

2. **Mount in `server.js`**:
```javascript
const { newfeatureRouter } = require('./modules/newfeature');
app.use('/api/newfeature', newfeatureRouter);
```

3. **Frontend**:
```
frontend/src/modules/newfeature/
├── pages/
│   └── NewFeaturePage.jsx
├── components/
│   └── NewFeatureComponent.jsx
└── services/
    └── NewFeatureService.js
```

4. **Add route in `App.js`**:
```javascript
<Route path="/newfeature" element={<NewFeaturePage />} />
```

---

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

---

## Deployment Considerations

### Backend
- Set `NODE_ENV=production`
- Use `npm start` (not `npm run dev`)
- Configure MongoDB Atlas with proper IP whitelist
- Set strong `OPENAI_API_KEY`
- Use process manager (PM2, systemd)

### Frontend
```bash
npm run build       # Creates optimized build/
# Serve build/ with nginx, Apache, or static hosting
```

---

## Troubleshooting

### Common Issues

1. **Backend crashes with "ragRoutes is not defined"**
   - **Fix**: Check `server.js` imports RAG module correctly
   - Should be: `const { ragRouter } = require('./modules/rag');`

2. **Frontend can't resolve `@/` imports**
   - **Fix**: Ensure `craco.config.js` and `jsconfig.json` are configured
   - Restart dev server after config changes

3. **React Router v7 compatibility errors**
   - **Fix**: Use React Router v6: `npm install react-router-dom@6.26.0`

4. **MongoDB connection refused**
   - **Fix**: Check `MONGO_URI` in `.env` and IP whitelist in MongoDB Atlas

5. **OpenAI API errors**
   - **Fix**: Verify `OPENAI_API_KEY` is valid and has credits

---

## Contributing

### Code Style
- **Backend**: CommonJS modules (`require/module.exports`)
- **Frontend**: ES6 modules (`import/export`)
- **Naming**: camelCase for functions, PascalCase for components
- **File naming**: kebab-case for files, PascalCase for React components

### Git Workflow
```bash
git checkout -b feature/new-feature
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
# Create pull request
```

---

## License
MIT

---

## Contact
Clinical Copilot Team

---

**Last Updated**: November 5, 2025  
**Version**: 1.0.0

