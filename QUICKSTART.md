# AAD Framework - Quick Start Guide

## 🎯 What You Have

A complete full-stack application for designing AI-resistant assessments:

### ✅ Backend (FastAPI - Python)
- 30 sample NLP questions with varying AI vulnerability
- RESTful API with all endpoints working
- ES calculation algorithm
- AI testing with OpenRouter (works with mock data without API key)
- Statistical analysis (correlations, regression)
- Data export (JSON/CSV)
- Comprehensive API documentation at `/docs`

### ✅ Frontend (Next.js 14 - TypeScript)
- Modern, responsive dashboard
- Statistics visualization
- Question management interface
- Real-time ES calculation
- Tailwind CSS styling

## 🚀 Setup & Run

### Step 1: Backend Setup

```bash
cd /home/qratul/rnd_projects/ai-vulnerability-education/demo_app/backend

# Activate conda environment
conda activate common_lt

# Install dependencies
pip install -r requirements.txt

# Create .env file (optional - works without API key)
cp .env.example .env

# Run the server
python main.py
```

✅ Backend will run at: http://localhost:8000
📚 API Docs available at: http://localhost:8000/docs

### Step 2: Frontend Setup

Open a new terminal:

```bash
cd /home/qratul/rnd_projects/ai-vulnerability-education/demo_app/frontend

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Run development server
npm run dev
```

✅ Frontend will run at: http://localhost:3000

## 📊 Demo the Application

### 1. View Statistics
- Navigate to http://localhost:3000
- See dashboard with 30 sample questions
- View ES distribution, course breakdown

### 2. Test the API
Visit http://localhost:8000/docs and try:

**Get all questions:**
```
GET /api/questions
```

**Get statistics:**
```
GET /api/analysis/statistics
```

**Calculate ES:**
```json
POST /api/es/calculate
{
  "bloomLevel": 1,
  "contextDependency": 1,
  "novelty": 1
}
```
Expected ES: ~85 (Highly Vulnerable)

```json
POST /api/es/calculate
{
  "bloomLevel": 6,
  "contextDependency": 5,
  "novelty": 5
}
```
Expected ES: ~15 (AI-Resistant)

**Test a question with AI:**
```json
POST /api/test/single
{
  "questionId": "nlp_001",
  "models": ["openai/gpt-4-turbo"]
}
```

### 3. Explore Sample Questions

The dataset includes great examples:

**Highly Vulnerable (ES > 70):**
- `nlp_001`: "What is tokenization in NLP?" 
  - Bloom: 1 (Remember), Context: 1 (Generic), Novelty: 1 (Common)

**AI-Resistant (ES < 30):**
- `nlp_004`: Complex project-based question about UVU Canvas data
  - Bloom: 6 (Create), Context: 5 (Course-specific), Novelty: 5 (Unique)
  
**Moderately Vulnerable:**
- `nlp_007`: "Compare Word2Vec and GloVe"
  - Bloom: 4 (Analyze), Context: 2, Novelty: 2

### 4. Understanding ES Calculation

Formula: `ES = (0.15 × bloom_factor) + (0.25 × context_factor) + (0.25 × novelty_factor) + (0.35 × ai_accuracy)`

Where factors are inverted (higher = better):
- bloom_factor = (7 - bloomLevel) × 10
- context_factor = (6 - contextDependency) × 15  
- novelty_factor = (6 - novelty) × 15

## 🎨 Project Structure

```
demo_app/
├── README.md                    # Main documentation
├── start.sh                     # Quick start script
│
├── backend/
│   ├── main.py                  # FastAPI app
│   ├── requirements.txt
│   ├── setup.sh
│   ├── .env.example
│   ├── app/
│   │   ├── config.py
│   │   ├── models/schemas.py
│   │   ├── api/
│   │   │   ├── questions.py     # CRUD operations
│   │   │   ├── testing.py       # AI testing
│   │   │   ├── es.py            # ES calculation
│   │   │   └── analysis.py      # Statistics
│   │   ├── services/
│   │   │   ├── es_calculator.py
│   │   │   └── openrouter.py
│   │   └── utils/
│   │       └── database.py      # In-memory DB
│   └── data/
│       └── sample_questions.json # 30 NLP questions
│
└── frontend/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx             # Dashboard
    │   └── globals.css
    ├── lib/
    │   ├── types.ts
    │   └── api-client.ts
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.js
    └── next.config.js
```

## 🧪 Testing Examples

### Test Different ES Levels

```python
# In Python or via API

# Highly Vulnerable Question
{
  "bloomLevel": 1,      # Remember
  "contextDependency": 1,  # Generic
  "novelty": 1          # Common
}
# Expected ES: ~85

# Moderately Resistant
{
  "bloomLevel": 4,      # Analyze
  "contextDependency": 3,  # Some context
  "novelty": 3          # Somewhat unique
}
# Expected ES: ~45

# AI-Resistant
{
  "bloomLevel": 6,      # Create
  "contextDependency": 5,  # Course-specific
  "novelty": 5          # Highly unique
}
# Expected ES: ~15
```

### Explore Correlations

```bash
curl http://localhost:8000/api/analysis/correlation
```

Expected insights:
- **Negative correlation** between Bloom's level and ES
- **Negative correlation** between Context dependency and ES
- **Negative correlation** between Novelty and ES

This validates that higher cognitive complexity, context dependency, and novelty reduce AI exploitability.

## 🔑 Key Features Demonstrated

### 1. Exploitability Score Calculation ✅
- Weighted algorithm considering multiple dimensions
- Real-time calculation
- Clear interpretation (AI-Resistant → Highly Vulnerable)

### 2. AI Testing (Mock & Real) ✅
- Works without API key (uses intelligent mocks)
- Simulates different AI performance based on question complexity
- Response scoring with accuracy and coherence metrics

### 3. Statistical Analysis ✅
- Overall statistics
- ES distribution
- Correlation analysis
- Regression analysis
- Data export

### 4. Sample Dataset ✅
- 30 realistic NLP questions
- Mix of question types (MC, short-answer, essay, project)
- Demonstrates vulnerability spectrum
- Includes rubrics and expected answers

### 5. Modern UI ✅
- Responsive dashboard
- Clean, professional design
- Interactive statistics
- ES color coding (green → red)

## 📈 Next Steps for Enhancement

### Phase 2 (Frontend Pages):
1. **Question Analyzer** - 4-step workflow for testing new questions
2. **Toolkit Page** - Design principles, before/after examples
3. **Question Detail View** - Deep dive into individual questions
4. **Batch Testing Interface** - Test multiple questions at once

### Phase 3 (Features):
1. **CSV Upload** - Bulk question import
2. **Question Editor** - In-app question creation/editing
3. **Advanced Filters** - Search and filter questions
4. **Visualization Improvements** - Interactive charts with Recharts

### Phase 4 (Production):
1. **Real Database** - PostgreSQL instead of in-memory
2. **Authentication** - User accounts and roles
3. **API Rate Limiting** - Protect endpoints
4. **Unit Tests** - Backend and frontend tests
5. **Deployment** - Docker containers, CI/CD

## 🐛 Troubleshooting

### Backend Issues

**Port already in use:**
```bash
lsof -ti:8000 | xargs kill -9
python main.py
```

**Import errors:**
```bash
conda activate common_lt
pip install -r requirements.txt
```

**Database not loading:**
- Check `backend/data/sample_questions.json` exists
- Delete `backend/data/questions.json` to reload samples

### Frontend Issues

**Dependencies not found:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Can't connect to backend:**
- Check backend is running at http://localhost:8000
- Verify `.env.local` has correct API URL
- Check browser console for CORS errors

## 📚 Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Next.js Docs**: https://nextjs.org/docs
- **Bloom's Taxonomy**: https://en.wikipedia.org/wiki/Bloom%27s_taxonomy
- **OpenRouter**: https://openrouter.ai/ (for real AI testing)

## ✨ Demo Script (5 Minutes)

1. **Show Dashboard** (1 min)
   - 30 questions loaded
   - Statistics: avg ES, distribution
   - Color-coded vulnerability

2. **API Documentation** (1 min)
   - Open /docs
   - Show endpoints
   - Try GET /api/questions

3. **ES Calculation Demo** (2 min)
   - Calculate ES for simple question (high ES)
   - Calculate ES for complex question (low ES)
   - Explain the formula and weights

4. **AI Testing Demo** (1 min)
   - Test a vulnerable question
   - Test an AI-resistant question
   - Show different AI responses

5. **Statistical Analysis** (30 sec)
   - Show correlations
   - Export data

## 🎓 Educational Value

This demo shows:
- ✅ How to quantify AI vulnerability
- ✅ What makes questions AI-resistant
- ✅ Practical framework for faculty
- ✅ Data-driven assessment design

Perfect for:
- Faculty development workshops
- Educational technology conferences
- Assessment design courses
- Research on AI in education

---

**Built with ❤️ for AI-resistant education**
