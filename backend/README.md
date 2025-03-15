# Alexandria Recommendation Engine API

This is the backend API for the Alexandria literary recommendation platform. It provides intelligent book recommendations using multiple AI services.

## Features

- **Intelligent Recommendations**: Uses a combination of OpenAI, Claude, and Perplexity AI to generate personalized book recommendations
- **Content Analysis**: Analyzes literary works to provide thematic connections and contextual insights
- **Cross-Validation**: Verifies book recommendation accuracy and relevance
- **Performance Optimizations**: Includes caching mechanisms for faster responses
- **API Security**: Implements API key authentication for secure access

## Architecture

The recommendation engine uses a multi-AI approach:

1. **Initial Recommendations**: Generated using Perplexity AI for comprehensive search
2. **Semantic Analysis**: Performed by OpenAI to understand nuanced relationships between works
3. **Validation & Enrichment**: Claude AI validates recommendations and generates contextual insights
4. **Consolidation**: Results are merged, ranked, and filtered for quality and diversity

## API Endpoints

- `GET /api/health`: Health check endpoint
- `GET /api/stats`: API usage statistics
- `POST /api/recommendations`: Main endpoint to get book recommendations

## Setup

### Prerequisites

- Python 3.9+
- API keys for:
  - OpenAI
  - Claude (Anthropic)
  - Perplexity

### Installation

```bash
# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys
```

### Running the API

```bash
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000 with interactive documentation at http://localhost:8000/docs

### Testing

```bash
# Run all tests
pytest

# Run only unit tests
pytest -m unit

# Run integration tests (requires API keys)
pytest -m integration
```

## Deployment

The API is designed to be easily deployed to cloud platforms that support Python. A Dockerfile and Procfile are included for containerization and deployment.

### Render Deployment

```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## License

[MIT License](../LICENSE) 