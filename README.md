# Alexandria

## About Alexandria

Alexandria is a digital library inspired by the lost Library of Alexandria, designed to unveil literary treasures through AI-powered recommendations. Our platform curates trending news, social posts, and articles based on your reading habits, creating a personalized literary discovery experience.

## Features

- **Book Recommendations**: AI-powered recommendations based on your interests and reading history
- **My Scrolls**: Save and organize your favorite literary works
- **Category Exploration**: Browse and filter through various literary categories
- **Librarian's Ledger**: View your reading statistics and analytics
- **Natural Language Search**: Find books using conversational language like "science fiction with AI themes"
- **Current Scrolls**: Discover trending content related to literature and reading

## Project Structure

The repository is organized into two main parts:

- **Frontend**: The React-based web application
- **Backend**: The Alexandria recommendation engine API (FastAPI)

## Getting Started

### Frontend

To run the frontend locally:

```sh
# Clone the repository
git clone https://github.com/kratos0002/lit-finder.git

# Navigate to the project directory
cd lit-finder

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

## Contributing

Contributions to Alexandria are welcome! Please feel free to submit pull requests or open issues to improve the platform.

## License

[MIT License](LICENSE)
