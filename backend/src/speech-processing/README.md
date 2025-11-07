# Speech Processing Module

This module handles all speech processing functionality for medical conversations, including transcription, medical information extraction, and patient record updates.

**Current Status**: ✅ **Fully Operational** - All major issues have been resolved and the system is working with OpenAI Whisper as the primary transcription method.

## File Structure

```
src/speech-processing/
├── index.js                 # Main module exports
├── config.js               # Configuration management
├── utils.js                # Utility functions
├── SpeechProcessingService.js  # Audio transcription service
├── MedicalInfoExtractor.js     # Medical information extraction
├── speechController.js         # API controllers
├── speech.js                   # Route definitions
└── README.md                   # This file
```

## Components

### 1. SpeechProcessingService.js
- **Primary**: OpenAI Whisper transcription (Medical Whisper disabled due to API issues)
- Medical terminology post-processing
- Audio format validation
- Comprehensive error handling and logging

### 2. MedicalInfoExtractor.js
- Hybrid information extraction strategy
- Three-pass approach: regex, LLM, ontology normalization
- Negation detection and medical terminology handling
- **Fixed**: Proper type handling for medical history (array vs string)
- Patient record mapping with data validation

### 3. speechController.js
- API endpoint handlers
- File upload management with multer
- Error handling and response formatting
- Patient record updates

### 4. speech.js
- Express route definitions
- Middleware integration
- API endpoint documentation

### 5. config.js
- Centralized configuration management
- Environment variable handling
- Configuration validation

### 6. utils.js
- Common utility functions
- File handling and cleanup
- Response formatting
- Logging utilities

## Usage

### Import the module
```javascript
const speechProcessing = require('./src/speech-processing');

// Use individual components
const { SpeechProcessingService, MedicalInfoExtractor } = speechProcessing;

// Or use the middleware
const middleware = speechProcessing.createSpeechProcessingMiddleware();
```

### API Endpoints

#### POST /api/speech/process
Process audio file and extract medical information.

**Request:**
- `audio`: Audio file (multipart/form-data)
- `patientId`: Patient ID (optional)
- `language`: Language code (default: 'en')

**Response:**
```json
{
  "success": true,
  "data": {
    "transcription": { ... },
    "medicalExtraction": { ... },
    "patientUpdate": { ... }
  }
}
```

#### POST /api/speech/transcribe
Transcribe audio file only.

#### POST /api/speech/extract
Extract medical information from text.

#### GET /api/speech/info
Get processing capabilities and supported formats.

## Configuration

Set these environment variables:

```bash
# Required
OPENAI_API_KEY=your_openai_key
HUGGINGFACE_API_KEY=your_huggingface_token_here  # Replace with your actual token

# Model Configuration
HF_MEDICAL_WHISPER_MODEL=openai/whisper-base  # Simplified model for stability
OPENAI_MODEL=gpt-4o  # Updated to support JSON response format

# Optional
MAX_AUDIO_FILE_SIZE=26214400  # 25MB
MEDICAL_EXTRACTION_CONFIDENCE_THRESHOLD=0.7
ENABLE_NEGATION_DETECTION=true
ENABLE_ONTOLOGY_NORMALIZATION=true
USE_IN_MEMORY=true  # For development with in-memory MongoDB
```

## Features

- **OpenAI Whisper Integration**: Primary transcription method with medical terminology optimization
- **Hybrid Extraction**: Combines regex, LLM, and ontology approaches
- **Automatic Patient Updates**: Updates patient records automatically
- **Negation Detection**: Handles "no fever", "denies pain" patterns
- **Comprehensive Error Handling**: Graceful fallbacks and detailed error messages
- **Configurable Processing**: Adjustable confidence thresholds and processing options
- **Type Safety**: Proper handling of medical data types (arrays vs strings)
- **Frontend Integration**: Seamless integration with React frontend and editable fields

## Error Handling

The module includes comprehensive error handling:
- API key validation
- File size and format validation
- Network timeout handling
- Fallback processing strategies
- Detailed error logging

## Recent Fixes & Updates

### ✅ Resolved Issues (October 2025)

1. **Medical Whisper API Issues**: 
   - **Problem**: Hugging Face API consistently failing with authentication and pipeline errors
   - **Solution**: Disabled Medical Whisper, using OpenAI Whisper as primary method
   - **Status**: ✅ Fixed

2. **Medical History Type Error**: 
   - **Problem**: `TypeError: medical.medicalHistory?.join is not a function`
   - **Solution**: Added proper type checking for arrays vs strings
   - **Status**: ✅ Fixed

3. **Frontend Patient ID Mismatch**: 
   - **Problem**: Frontend using `patient.id` instead of `patient._id`
   - **Solution**: Updated all frontend API calls to use `patient._id`
   - **Status**: ✅ Fixed

4. **OpenAI Model Compatibility**: 
   - **Problem**: `response_format: json_object` not supported with gpt-4
   - **Solution**: Updated to gpt-4o model
   - **Status**: ✅ Fixed

5. **Editable Fields**: 
   - **Problem**: Medical fields not editable after auto-filling
   - **Solution**: Implemented editing functionality with save/cancel buttons
   - **Status**: ✅ Fixed

### 🔧 Current Configuration

- **Primary Transcription**: OpenAI Whisper (stable and reliable)
- **Medical Extraction**: GPT-4o with JSON response format
- **Frontend Integration**: VoiceRecordingButton in patient detail page only
- **Database**: In-memory MongoDB for development
- **Token**: Updated Hugging Face token with proper permissions

## Known Limitations

- Medical Whisper disabled due to API stability issues
- In-memory database resets on server restart (development only)
- Audio files must be longer than 0.1 seconds for processing

## Dependencies

- `@huggingface/inference`: Hugging Face API integration (currently disabled)
- `openai`: OpenAI Whisper and GPT-4o integration
- `multer`: File upload handling
- `natural`: Natural language processing
- `compromise`: Text processing
- `axios`: HTTP requests
- `form-data`: Form data handling