# Environment Setup for Medical Speech Processing

## Backend Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/clinicaldb

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Hugging Face Configuration
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Server Configuration
PORT=5001
NODE_ENV=development

# Audio Processing Configuration
MAX_AUDIO_FILE_SIZE=26214400  # 25MB in bytes
TEMP_DIR=./temp

# Medical Information Extraction Configuration
MEDICAL_EXTRACTION_CONFIDENCE_THRESHOLD=0.7
ENABLE_NEGATION_DETECTION=true
ENABLE_ONTOLOGY_NORMALIZATION=true
```

## API Keys Setup

### 1. OpenAI API Key
- Visit https://platform.openai.com/api-keys
- Create a new API key
- Add it to your `.env` file as `OPENAI_API_KEY`

### 2. Hugging Face API Key
- Visit https://huggingface.co/settings/tokens
- Create a new access token
- Add it to your `.env` file as `HUGGINGFACE_API_KEY`

## Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```bash
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
```

## Features Enabled

With this setup, you'll have:

1. **Medical Whisper Integration**: Uses Na0s/Medical-Whisper-Large-v3 for medical terminology optimization
2. **Hybrid Information Extraction**: Three-pass strategy with regex, LLM, and ontology normalization
3. **Automatic Patient Record Updates**: Extracted information automatically populates patient fields
4. **Negation Detection**: Handles "no fever", "denies chest pain" patterns
5. **Backend Processing**: Doctors don't need to stay on the page during processing
6. **Confidence Scoring**: Quality assessment for extracted information

## Usage

1. Start both servers (frontend and backend)
2. Navigate to the dashboard
3. Click "Record Conversation" on any patient card
4. Speak the doctor-patient conversation
5. Click "Stop Recording"
6. The system will automatically transcribe and extract medical information
7. Patient records will be updated with the extracted data


