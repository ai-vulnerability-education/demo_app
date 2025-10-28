"""
AAD Framework FastAPI Backend

A system for measuring and reducing the exploitability of assessment questions.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import questions, testing, es, analysis

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Adversarial Assessment Design Framework - Help faculty design AI-resistant assessments"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(questions.router)
app.include_router(testing.router)
app.include_router(es.router)
app.include_router(analysis.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AAD Framework API",
        "version": settings.app_version,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
