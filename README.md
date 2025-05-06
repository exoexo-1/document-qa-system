# Document Q&A System

A Retrieval-Augmented Generation (RAG) based system for intelligent document analysis and question answering.

![Screenshot 2025-05-07 000332](https://github.com/user-attachments/assets/d31529d8-a6d9-42ad-aed1-be06eebd41b7)
![Screenshot 2025-05-07 000316](https://github.com/user-attachments/assets/16862d0e-e094-4141-be51-bfd1fc3004a2)


## Features

- **Document Processing**: Upload and process PDF, DOCX, and TXT files
- **Intelligent Q&A**: Ask natural language questions about document content
- **RAG Architecture**: Uses state-of-the-art retrieval-augmented generation
- **Conversational Interface**: Maintains context through multi-turn conversations

## Architecture

This project implements a full-stack application:

- **Frontend**: React-based UI with file upload and chat interface
- **Backend**: FastAPI service for document processing and question answering
- **AI Integration**: OpenAI embeddings and LLM for semantic search and response generation

## Tech Stack

### Frontend
- React
- Lucide React (for icons)
- Axios (for API communication)

### Backend
- FastAPI
- PyMuPDF (for PDF processing)
- docx2txt (for DOCX processing)
- OpenAI API (for embeddings and response generation)
- NumPy (for vector operations)

## Getting Started

### Prerequisites

- Node.js (v14+)
- Python (v3.8+)
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/exoexo-1/document-qa-system.git
   cd document-qa-system
   ```

2. **Backend Setup**
   ```bash
   # Navigate to backend directory
   cd backend
   
   # Create and activate virtual environment
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Create OpenAI API key environment file
   echo "OPENAI_API_KEY=your_openai_api_key_here" > OPENAI_API_KEY.env
   ```

3. **Frontend Setup**
   ```bash
   # Navigate to frontend directory
   cd ../frontend
   
   # Install dependencies
   npm install
   
   # Optional: Create environment file
   echo "REACT_APP_API_URL=http://localhost:8000" > .env
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   # Make sure you're in the backend directory with virtual environment activated
   cd backend
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   
   # Run the FastAPI server
   python app.py
   ```

2. **Start the frontend development server**
   ```bash
   # In a new terminal, navigate to the frontend directory
   cd frontend
   
   # Start the React development server
   npm start
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Usage

1. Upload a document (PDF, DOCX, or TXT) using the upload interface
2. Wait for the document to be processed
3. Ask questions about the document content in the chat interface
4. View AI-generated responses based on your document

## System Architecture

   ```
document-qa-system/
├── frontend/               # React frontend
│   ├── public/
│   ├── src/
│   │   ├── App.js          # Main application component
│   │   ├── App.css         # Styling for the application
│   │   └── services/api.js # API service for backend communication
│   ├── package.json
│   └── README.md
└── backend/                # FastAPI backend
    ├── app.py              # Main API application
    └── requirements.txt    # Python dependencies

   ```
The system follows these steps:
1. User uploads a document
2. Backend processes document (text extraction, chunking)
3. Text chunks are converted to embeddings via OpenAI
4. User asks questions about the document
5. System finds relevant chunks using semantic search
6. LLM generates responses using retrieved context

## Project Structure

```
document-qa-system/
├── frontend/          # React frontend
│   ├── public/        # Static assets
│   ├── src/           # Source code
│   │   ├── App.js     # Main application component
│   │   ├── App.css    # Styling
│   │   └── services/  # API services
│   └── package.json   # Dependencies
│
└── backend/           # FastAPI backend
    ├── app.py         # Main API application
    └── requirements.txt  # Python dependencies
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request



## Acknowledgments

- OpenAI for providing the API for embeddings and response generation
- FastAPI for the efficient Python web framework
- React team for the frontend framework
