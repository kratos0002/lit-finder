# Alexandria Library (lit-finder)

A literary recommendation engine powered by AI that helps users discover books based on their interests and preferences.

## Project Structure

This project is organized with a clean separation between frontend and backend:

```
lit-finder/
├── frontend/     # React frontend application
│   ├── src/      # Source code for the frontend
│   ├── public/   # Static assets
│   └── ...       # Configuration files
├── backend/      # Python FastAPI backend
│   ├── app/      # Main application code
│   ├── tests/    # Backend tests
│   └── ...       # Configuration files
└── README.md     # Project documentation
```

## Features

- Book search and discovery based on natural language queries
- AI-powered recommendations using multiple models
- Literary analysis and comparison
- Beautiful dark-themed UI with elegant typography
- User reading lists and preferences

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file based on `.env.example` and add your API keys.

5. Run the development server:
   ```
   uvicorn app.main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example` and configure it.

4. Start the development server:
   ```
   npm run dev
   ```

## Deployment

- Backend: Deployed on Render
- Frontend: Deployed on Vercel

## Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Python, FastAPI, Pydantic
- **AI Integration**: OpenAI API, Claude AI, Perplexity

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
