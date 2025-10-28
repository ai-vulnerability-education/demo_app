# Adversarial Assessment Design (AAD) Framework

A full-stack web application that helps faculty design AI-resistant assessments by measuring and reducing the "Exploitability Score" (ES) of their questions.

![AAD Framework](https://img.shields.io/badge/Status-Demo-blue)
![Python](https://img.shields.io/badge/Python-3.11+-green)
![Next.js](https://img.shields.io/badge/Next.js-14-black)

## 🎯 Overview

With AI tools like ChatGPT becoming ubiquitous, traditional assessments face new challenges. The AAD Framework:

- **Measures vulnerability**: Calculates an Exploitability Score (ES) showing how easily AI can complete an assessment
- **Tests with real AI**: Uses GPT-4, Claude, and Gemini to evaluate question resistance
- **Provides recommendations**: Offers actionable advice to redesign vulnerable questions
- **Analyzes patterns**: Statistical analysis to identify what makes questions AI-resistant

## 🏗️ Architecture

```
Frontend (Next.js 14) → API Routes → Backend (FastAPI) → OpenRouter → AI Models
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+** with Anaconda
- **Node.js 18+** and npm
- **OpenRouter API Key** (optional for demo - works without it)

### Backend Setup

```bash
# Navigate to backend directory
cd /home/qratul/rnd_projects/ai-vulnerability-education/demo_app/backend

# Activate conda environment
conda activate common_lt

# Install Python dependencies
pip install -r requirements.txt

# Create .env file (copy from .env.example)
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY if you have one
# The app works with mock data if no API key is provided

# Run the backend server
python main.py
# Or use uvicorn directly:
# uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### Frontend Setup

```bash
# Navigate to frontend directory
cd /home/qratul/rnd_projects/ai-vulnerability-education/demo_app/frontend

# Install dependencies
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Run development server
npm run dev
```

The application will be available at `http://localhost:3000`

## 📊 Sample Data

The backend comes pre-loaded with 30 realistic NLP course questions:

- **10 highly vulnerable** (ES > 70): Simple recall questions
- **15 moderately vulnerable** (ES 40-70): Application/analysis questions  
- **5 AI-resistant** (ES < 30): Project-based, context-heavy questions

Examples demonstrate:
- ✅ Generic vs course-specific context
- ✅ Recall vs creative synthesis
- ✅ Common vs unique scenarios

## 🧮 Exploitability Score Calculation

```python
ES = (0.15 × bloom_factor) + (0.25 × context_factor) + 
     (0.25 × novelty_factor) + (0.35 × ai_accuracy)
```

Where:
- **Bloom's Taxonomy** (1-6): 1=Remember → 6=Create
- **Context Dependency** (1-5): 1=Generic → 5=Course-specific
- **Novelty** (1-5): 1=Common → 5=Unique
- **AI Accuracy** (0-100): Average performance across AI models

Lower ES = More AI-resistant ✅

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern async Python web framework
- **Pandas/NumPy** - Data analysis
- **SciPy** - Statistical analysis
- **OpenRouter** - Multi-model AI testing

### Frontend (Coming Soon)
- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality components
- **Recharts** - Data visualization

## 📡 API Endpoints

### Questions
- `GET /api/questions` - List all questions (with filters)
- `GET /api/questions/{id}` - Get single question
- `POST /api/questions` - Create new question
- `PUT /api/questions/{id}` - Update question
- `DELETE /api/questions/{id}` - Delete question

### AI Testing
- `POST /api/test/single` - Test question with AI models
- `POST /api/test/batch` - Test multiple questions
- `GET /api/test/results/{id}` - Get test results

### Analysis
- `GET /api/analysis/statistics` - Overall statistics
- `GET /api/analysis/correlation` - Correlation matrix
- `POST /api/analysis/regression` - Regression analysis
- `GET /api/analysis/export?format=json|csv` - Export data

### ES Calculation
- `POST /api/es/calculate` - Calculate ES with all criteria
- `POST /api/es/predict` - Estimate ES from criteria only

## 🔬 Testing the Demo

1. **Start the backend**: `python main.py`
2. **Visit API docs**: http://localhost:8000/docs
3. **Try these examples**:

```bash
# Get all questions
curl http://localhost:8000/api/questions

# Get statistics
curl http://localhost:8000/api/analysis/statistics

# Calculate ES for a question
curl -X POST http://localhost:8000/api/es/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "bloomLevel": 1,
    "contextDependency": 1,
    "novelty": 1
  }'

# Test a question with AI (uses mock responses if no API key)
curl -X POST http://localhost:8000/api/test/single \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "nlp_001",
    "models": ["openai/gpt-4-turbo"]
  }'
```

## 📁 Project Structure

```
demo_app/
├── backend/
│   ├── main.py                 # FastAPI entry point
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example           # Environment template
│   ├── app/
│   │   ├── config.py          # Configuration
│   │   ├── models/
│   │   │   └── schemas.py     # Pydantic models
│   │   ├── api/
│   │   │   ├── questions.py   # Question CRUD
│   │   │   ├── testing.py     # AI testing
│   │   │   ├── es.py          # ES calculation
│   │   │   └── analysis.py    # Statistical analysis
│   │   ├── services/
│   │   │   ├── es_calculator.py    # ES algorithm
│   │   │   └── openrouter.py       # AI API client
│   │   └── utils/
│   │       └── database.py    # In-memory database
│   └── data/
│       ├── sample_questions.json   # Sample data
│       └── questions.json          # Runtime data
│
└── frontend/                  # (To be created)
    └── [Next.js app structure]
```

## 🎨 Key Features

### ✅ Implemented (Backend)
- [x] Question CRUD operations
- [x] ES calculation algorithm
- [x] AI testing with OpenRouter (with mock fallback)
- [x] Response scoring
- [x] Statistical analysis (correlations, regression)
- [x] Data export (JSON/CSV)
- [x] Sample dataset (30 NLP questions)
- [x] RESTful API with FastAPI
- [x] API documentation (Swagger)

### 🚧 To Do (Frontend - Next Phase)
- [ ] Dashboard with statistics and charts
- [ ] Question analyzer (4-step workflow)
- [ ] AI-resistant toolkit
- [ ] Interactive ES calculator
- [ ] Batch testing interface
- [ ] Data visualization components

## 🔐 Environment Variables

### Backend (.env)
```bash
OPENROUTER_API_KEY=your_key_here  # Optional - uses mocks if not provided
ALLOWED_ORIGINS=http://localhost:3000
DATABASE_URL=sqlite:///./aad.db
ENVIRONMENT=development
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🚀 Deployment

### Backend (Railway/Render)
1. Connect GitHub repository
2. Set environment variables
3. Use start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel)
1. Import repository
2. Set build command: `npm run build`
3. Set environment variables

## 🧪 Development

```bash
# Run backend with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run frontend with hot reload
npm run dev

# Format Python code
black app/

# Lint Python code
flake8 app/
```

## 📚 Learn More

- **Bloom's Taxonomy**: [Anderson & Krathwohl (2001)](https://en.wikipedia.org/wiki/Bloom%27s_taxonomy)
- **AI in Education**: Implications for assessment design
- **FastAPI**: https://fastapi.tiangolo.com/
- **Next.js**: https://nextjs.org/

## 🤝 Contributing

This is a research demo project. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 👥 Authors

Built for educational research on AI-resistant assessment design.

---

**Note**: This is a demonstration application. For production use, implement:
- Real database (PostgreSQL)
- Authentication & authorization
- Rate limiting
- Caching
- Comprehensive error handling
- Unit and integration tests
