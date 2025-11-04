# RAG System Quick Reference

## 🚀 Quick Start

### 1. Setup Environment
```bash
# Backend
cd server
npm install
cp .env.example .env  # Add your MongoDB URI and OpenAI API key

# Frontend  
cd frontend
npm install
```

### 2. Initialize Database
```bash
# Generate mock data
npm run generate-mock-data

# Create vector search index
npm run create-vector-index
```

### 3. Start Services
```bash
# Backend (Terminal 1)
cd server && npm run dev

# Frontend (Terminal 2)
cd frontend && npm start
```

## 🔧 Key Commands

| Command | Purpose |
|---------|---------|
| `npm run generate-mock-data` | Create 50 mock patients with embeddings |
| `npm run create-vector-index` | Create MongoDB vector search index |
| `npm run dev` | Start backend with nodemon |
| `npm start` | Start React frontend |

## 📡 API Endpoints

### RAG Search
```bash
curl -X POST http://localhost:5001/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Find patients with diabetes"}'
```

### AI Generation
```bash
curl -X POST http://localhost:5001/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Analyze patient data", "systemMessage": "You are a medical AI"}'
```

## 🗂️ File Structure

```
server/src/
├── controllers/
│   ├── ragController.js      # RAG search endpoint
│   └── aiController.js       # AI generation endpoint
├── services/
│   ├── vectorSearch.js       # Vector search logic
│   ├── embeddingService.js   # Embedding generation
│   └── OpenAIService.js      # OpenAI API integration
├── routes/
│   ├── rag.js               # RAG routes
│   └── ai.js                # AI routes
└── scripts/
    ├── generateMockData.js   # Mock data generation
    └── createVectorIndex.js  # Vector index creation

frontend/src/
├── services/
│   └── RAGService.js         # Frontend RAG logic
├── pages/
│   └── AIAssistant.jsx      # Main AI interface
└── components/chat/
    └── QuickPrompts.jsx     # RAG query templates
```

## 🔍 Query Types

| Query Type | Example | Search Strategy |
|------------|---------|-----------------|
| `symptom_search` | "Find patients with chest pain" | Vector search |
| `condition_search` | "Show diabetic patients" | Vector search |
| `treatment_search` | "What treatments worked?" | Comprehensive |
| `demographic_search` | "Find elderly patients" | Targeted |
| `outcome_search` | "Show successful outcomes" | Comprehensive |
| `general` | "How are patients doing?" | Comprehensive |

## 🛠️ Troubleshooting

### Vector Search Issues
```bash
# Check if index exists
npm run create-vector-index

# Verify mock data
npm run generate-mock-data
```

### Common Errors
- **"No similar patients found"** → Run `npm run create-vector-index`
- **"401 Incorrect API key"** → Check OpenAI API key in `.env`
- **"Cannot find module"** → Run `npm install` in both directories

### Debug Steps
1. Check backend logs for errors
2. Verify MongoDB connection
3. Test API endpoints with curl
4. Check browser console for frontend errors

## 📊 Performance Tips

- **Vector Search**: ~1-2 seconds response time
- **AI Generation**: ~3-5 seconds response time
- **Cache**: Results cached for 5-15 minutes
- **Batch Size**: Process embeddings in batches of 10

## 🔐 Security Notes

- Store API keys in `.env` file
- Use HTTPS in production
- Implement rate limiting
- Log access for audit trails

## 📈 Monitoring

- Check MongoDB Atlas for vector search performance
- Monitor OpenAI API usage and costs
- Track response times and error rates
- Analyze user query patterns

## 🚀 Production Checklist

- [ ] MongoDB Atlas cluster configured
- [ ] Vector search index created
- [ ] OpenAI API key valid
- [ ] Environment variables set
- [ ] Mock data generated
- [ ] API endpoints tested
- [ ] Frontend-backend integration working
- [ ] Error handling implemented
- [ ] Security measures in place
