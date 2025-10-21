# RAG System Documentation

## Overview

The Retrieval-Augmented Generation (RAG) system is a sophisticated AI-powered solution that combines vector search capabilities with generative AI to provide intelligent medical insights. The system uses MongoDB Atlas vector search to find similar patients and OpenAI's GPT models to generate contextual responses.

## Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   External      │
│   (React)       │    │   (Express)     │    │   Services      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • AIAssistant   │◄──►│ • RAG Service   │◄──►│ • OpenAI API    │
│ • RAGService    │    │ • Vector Search │    │ • MongoDB Atlas │
│ • QuickPrompts  │    │ • AI Controller │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow

1. **User Query** → Frontend receives user input
2. **Query Classification** → System determines query type and search strategy
3. **Vector Search** → MongoDB Atlas searches for similar patients
4. **Context Building** → Relevant patient data is compiled
5. **AI Generation** → OpenAI generates contextual response
6. **Response Delivery** → User receives intelligent insights

## Core Components

### 1. Frontend Components

#### AIAssistant.jsx
- Main AI interface component
- Handles user interactions and message display
- Integrates with RAG service for intelligent responses

#### RAGService.js
- Core RAG logic implementation
- Query classification and processing
- Vector search integration
- AI response generation

#### QuickPrompts.jsx
- Pre-defined query templates
- RAG-specific prompt suggestions
- User experience enhancement

### 2. Backend Components

#### RAG Controller (`ragController.js`)
```javascript
// Handles RAG search requests
async function searchPatientsRAG(req, res) {
  const { query } = req.body;
  const results = await searchSimilarPatients(query);
  res.json(results);
}
```

#### Vector Search Service (`vectorSearch.js`)
```javascript
// Performs vector similarity search
async function searchSimilarPatients(query, topK = 5) {
  const embeddingResponse = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });
  
  const results = await PatientEmbedding.aggregate([
    {
      $vectorSearch: {
        index: "patients_embedding_index",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: 50,
        limit: topK,
      },
    },
  ]);
  
  return results;
}
```

#### Embedding Service (`embeddingService.js`)
```javascript
// Creates and stores patient embeddings
async function embedAndStorePatient(patient) {
  const text = `
    First Name: ${patient.first_name}
    Last Name: ${patient.last_name}
    Date of Birth: ${patient.date_of_birth}
    Gender: ${patient.gender}
    Chief Complaint: ${patient.chief_complaint}
    Medical History: ${patient.medical_history}
    Diagnosis: ${patient.diagnosis}
    Symptoms: ${patient.symptoms}
    Current Medications: ${patient.curent_medications}
    Allergies: ${patient.allergies}
    Treatment Plan: ${patient.treatment_plan}
    AI Summary Content: ${patient.ai_summary_content}
    Vital Signs: ${patient.vital_signs}
  `;

  const embeddingResponse = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  const embedding = embeddingResponse.data[0].embedding;
  // Store embedding in database
}
```

### 3. Database Schema

#### Patient Embedding Collection
```javascript
const patientEmbeddingSchema = new mongoose.Schema({
  patient_id: String,
  chunk_index: Number,
  content: String,
  embedding: { type: [Number], index: "2dsphere" },
});
```

#### Vector Search Index
- **Name**: `patients_embedding_index`
- **Collection**: `patients_embedding`
- **Dimensions**: 1536 (OpenAI text-embedding-3-small)
- **Similarity**: Cosine similarity
- **Fields**: `embedding` field with vector data

## Setup and Configuration

### 1. Environment Variables

Create a `.env` file in the `server/` directory:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/clinicaldb
OPENAI_API_KEY=sk-your-openai-api-key
```

### 2. Database Setup

#### MongoDB Atlas Configuration
1. Create a MongoDB Atlas cluster
2. Configure network access (whitelist IP addresses)
3. Create database user with read/write permissions
4. Set up vector search index

#### Vector Search Index Creation
```javascript
// Run the vector index creation script
npm run create-vector-index
```

### 3. Mock Data Generation

```bash
# Generate quality mock patient data
npm run generate-mock-data
```

This script will:
- Create 50 diverse patient records
- Generate embeddings for each patient
- Store data in MongoDB Atlas
- Verify vector search functionality

## API Endpoints

### RAG Search Endpoint
```
POST /api/rag/search
Content-Type: application/json

{
  "query": "Find patients with similar symptoms to chest pain"
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "patient_id": "68e77becfadcb16c20642849",
      "content": "Patient data...",
      "score": 0.85
    }
  ]
}
```

### AI Generation Endpoint
```
POST /api/ai/generate
Content-Type: application/json

{
  "prompt": "Analyze patient data...",
  "systemMessage": "You are a medical AI assistant."
}
```

## Query Classification System

The system automatically classifies user queries into different types:

### Query Types
- **symptom_search**: "Find patients with chest pain"
- **condition_search**: "Show diabetic patients"
- **treatment_search**: "What treatments worked for hypertension?"
- **demographic_search**: "Find elderly patients"
- **outcome_search**: "Show successful treatment outcomes"
- **general**: General medical questions

### Search Strategies
- **vector_search**: Use vector similarity for specific patient matching
- **comprehensive**: Use all patient data for broad analysis
- **targeted**: Focus on specific patient attributes

## Vector Search Implementation

### Embedding Generation
- **Model**: OpenAI `text-embedding-3-small`
- **Dimensions**: 1536
- **Input**: Comprehensive patient data (demographics, symptoms, diagnosis, treatment, etc.)
- **Output**: 1536-dimensional vector representation

### Similarity Search
- **Algorithm**: Cosine similarity
- **Index**: MongoDB Atlas vector search
- **Candidates**: 50 (configurable)
- **Results**: Top 5 similar patients (configurable)

### Search Process
1. **Query Embedding**: Convert user query to vector
2. **Vector Search**: Find similar patient embeddings
3. **Context Building**: Compile relevant patient data
4. **AI Generation**: Generate contextual response

## AI Response Generation

### Prompt Engineering
The system uses sophisticated prompt engineering to generate contextual responses:

```javascript
const systemMessage = `You are a medical AI assistant with access to patient data. 
Provide insights based on the retrieved patient information.`;

const prompt = `
**User Query:** "${userQuery}"

**Retrieved Patient Data:**
${patientData}

**Instructions:**
- Analyze the retrieved patient data
- Provide specific insights related to the query
- Include relevant statistics and patterns
- Maintain medical accuracy and professionalism
`;
```

### Response Types
- **Patient Analysis**: Detailed analysis of specific patients
- **Pattern Recognition**: Identification of medical patterns
- **Treatment Insights**: Treatment effectiveness analysis
- **Risk Assessment**: Patient risk evaluation
- **Recommendations**: Clinical recommendations

## Performance Optimization

### Caching Strategy
- **Vector Search Results**: Cached for 5 minutes
- **AI Responses**: Cached for 10 minutes
- **Patient Data**: Cached for 15 minutes

### Response Time Optimization
- **Parallel Processing**: Vector search and AI generation run concurrently
- **Batch Operations**: Multiple embeddings generated in batches
- **Connection Pooling**: Database connection optimization

### Error Handling
- **Fallback Mechanisms**: Graceful degradation when vector search fails
- **Retry Logic**: Automatic retry for failed API calls
- **User Feedback**: Clear error messages and suggestions

## Security Considerations

### API Key Management
- **Environment Variables**: Secure storage of API keys
- **Access Control**: Restricted access to sensitive endpoints
- **Rate Limiting**: Protection against abuse

### Data Privacy
- **Patient Anonymization**: No personally identifiable information in logs
- **Secure Transmission**: HTTPS for all API calls
- **Access Logging**: Comprehensive audit trail

## Monitoring and Analytics

### Performance Metrics
- **Vector Search Latency**: Average response time
- **AI Generation Time**: Response generation duration
- **Cache Hit Rate**: Caching effectiveness
- **Error Rate**: System reliability metrics

### Usage Analytics
- **Query Types**: Most common query patterns
- **Search Effectiveness**: Vector search success rate
- **User Engagement**: Interaction patterns and feedback

## Troubleshooting

### Common Issues

#### Vector Search Returns No Results
- **Cause**: Missing vector search index
- **Solution**: Run `npm run create-vector-index`
- **Verification**: Check MongoDB Atlas for index existence

#### OpenAI API Errors
- **Cause**: Invalid API key or rate limiting
- **Solution**: Verify API key and check usage limits
- **Fallback**: System gracefully falls back to general patient data

#### Database Connection Issues
- **Cause**: Network or authentication problems
- **Solution**: Verify MongoDB URI and network access
- **Alternative**: Use in-memory MongoDB for development

### Debug Commands
```bash
# Check vector search index
npm run create-vector-index

# Generate test data
npm run generate-mock-data

# Test RAG endpoint
curl -X POST http://localhost:5001/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Find patients with diabetes"}'
```

## Future Enhancements

### Planned Features
- **Multi-language Support**: Support for multiple languages
- **Advanced Analytics**: Enhanced pattern recognition
- **Real-time Updates**: Live patient data synchronization
- **Mobile Integration**: Mobile app support

### Performance Improvements
- **Distributed Search**: Multi-cluster vector search
- **Advanced Caching**: Redis-based caching system
- **Load Balancing**: Horizontal scaling support

## Conclusion

The RAG system provides a powerful foundation for intelligent medical insights by combining vector search with generative AI. The system is designed for scalability, reliability, and user experience, making it suitable for production medical applications.

For technical support or questions, please refer to the troubleshooting section or contact the development team.
