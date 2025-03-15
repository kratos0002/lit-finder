
# Alexandria

## About Alexandria

Alexandria is a digital library inspired by the lost Library of Alexandria, designed to unveil literary treasures through AI-powered recommendations. Our platform curates trending news, social posts, and articles based on your reading habits, creating a personalized literary discovery experience.

## Project Structure

This repository is organized as a monorepo with the following structure:

- `/frontend`: The React-based web application
- `/backend`: The Alexandria recommendation engine API (FastAPI)

## Features

- **Book Recommendations**: AI-powered recommendations based on your interests and reading history
- **My Scrolls**: Save and organize your favorite literary works
- **Category Exploration**: Browse and filter through various literary categories
- **Librarian's Ledger**: View your reading statistics and analytics
- **Natural Language Search**: Find books using conversational language like "science fiction with AI themes"
- **Current Scrolls**: Discover trending content related to literature and reading

## Getting Started

### Frontend

To run the frontend locally:

```sh
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm i

# Start the development server
npm run dev
```

### Backend

To run the recommendation engine API:

```sh
# Navigate to the backend directory
cd backend

# Create a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up your .env file
cp .env.example .env
# Edit the .env file with your API keys

# Start the API server
uvicorn app.main:app --reload
```

## API Documentation

The recommendation engine API provides the following main endpoints:

- `GET /api/health`: Check API health status
- `GET /api/stats`: Get API usage statistics
- `POST /api/recommendations`: Get book recommendations

For full documentation, run the API server and visit `http://localhost:8000/docs`

## Tech Stack

Alexandria is built with modern technologies:

### Frontend
- React
- TypeScript
- Tailwind CSS
- shadcn/ui Components
- Supabase for backend functionality

### Backend
- FastAPI
- Python
- Multiple AI services:
  - OpenAI GPT-3.5
  - Claude 3.5 Sonnet
  - Perplexity Sonar

## Development

This project uses Vite for frontend development and FastAPI for the backend. After running the dev servers, you'll have access to hot-module replacement and instant previews of your changes.

## Deployment

The project is set up for deployment with:

- Frontend: Vercel, Netlify, or any static hosting service
- Backend: Render, Railway, or any Python hosting service

Make sure to set the appropriate environment variables in your deployment environment.

## Contributing

Contributions to Alexandria are welcome! Please feel free to submit pull requests or open issues to improve the platform.

## License

[MIT License](LICENSE)
