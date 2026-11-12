# LinkedIn Talent Finder

A web application to streamline talent discovery using LinkedIn data. Built with a React frontend and a Python backend.

## 📁 Project Structure

```
LinkedIn-Talent-Finder/
├── frontend/        # React app
├── backend/         # Python backend (FastAPI)
└── README.md
```

## Getting Started

### Prerequisites

- **Node.js**: v18+ or v20+ (with npm)
- **Python**: v3.10+ / v3.11+
- **Docker & Docker Compose**: For running PostgreSQL (`5433`) and Qdrant Vector DB (`6333`)
- **Groq API Key**: For Meta Llama 3.3 70B semantic candidate scoring
- **Git**: For version control

### 1. Clone the Repository

```bash
git clone https://github.com/adhi8724r/LinkedIn-Talent-Finder.git
cd LinkedIn-Talent-Finder
```

### 2. Setup Backend

1. **Start Infrastructure Services (PostgreSQL & Qdrant)**:

```bash
docker compose up -d
```

2. **Configure Environment Variables**:

Copy the example environment template:

```bash
cd backend
cp .env.example .env    # On Windows PowerShell: copy .env.example .env
```

Set your local database credentials and Groq API key in `backend/.env`:

```env
postgres_url=postgresql://<DB_USERNAME>:<DB_PASSWORD>@localhost:5433/resume_db
qdrant_host=http://localhost:6333
SECRET_KEY=your_secret_key_here
api=your_groq_api_key_here
```

3. **Install Dependencies & Launch FastAPI Server**:

```bash
python -m venv venv

# On Windows:
venv\Scripts\activate

# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

Backend API server will run at `http://127.0.0.1:8000`.

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend development server will run at `http://localhost:3000`.

## 🧪 Testing

- Frontend: `npm test`
- Backend: `pytest` or your preferred test runner

## 🤝 Contributing

1. Fork the repo
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## 📄 License

MIT License

---
