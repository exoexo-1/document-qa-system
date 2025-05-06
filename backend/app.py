from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import tempfile
import uvicorn
import uuid
import json
from datetime import datetime

# Document processing libraries
import fitz  # PyMuPDF for PDF processing
import docx2txt  # For DOCX processing
import tiktoken  # OpenAI's tokenizer
import numpy as np
from openai import OpenAI

# Create FastAPI app
app = FastAPI(title="Document Q&A API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Define models
class Question(BaseModel):
    document_id: str
    question: str
    chat_history: Optional[List[Dict[str, str]]] = []

class Answer(BaseModel):
    answer: str
    context: List[str]
    processing_time: float

# In-memory document store (would use a database in production)
document_store = {}

# Extract text from different file types
def extract_text(file_path: str) -> str:
    """Extract text from PDF, DOCX, or TXT files."""
    file_extension = os.path.splitext(file_path)[1].lower()
    
    if file_extension == '.pdf':
        text = ""
        with fitz.open(file_path) as doc:
            for page in doc:
                text += page.get_text()
        return text
    
    elif file_extension == '.docx':
        return docx2txt.process(file_path)
    
    elif file_extension == '.txt':
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    
    else:
        raise ValueError(f"Unsupported file type: {file_extension}")

# Split text into chunks
def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """Split text into overlapping chunks."""
    # Simple chunking by characters with overlap
    chunks = []
    start = 0
    text_length = len(text)
    
    while start < text_length:
        end = min(start + chunk_size, text_length)
        if end < text_length and text[end] != ' ':
            # Try to find the nearest space to avoid cutting words
            next_space = text.find(' ', end)
            if next_space != -1 and next_space - end < 50:  # Don't search too far
                end = next_space + 1
        
        chunks.append(text[start:end])
        start = end - overlap if end - overlap > start else start + 1
    
    return chunks

# Create embeddings for text chunks
def create_embeddings(chunks: List[str]) -> List[List[float]]:
    """Create embeddings for text chunks using OpenAI's API."""
    embeddings = []
    
    for chunk in chunks:
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=chunk,
            encoding_format="float"
        )
        embeddings.append(response.data[0].embedding)
    
    return embeddings

# Semantic search using cosine similarity
def semantic_search(query: str, chunks: List[str], embeddings: List[List[float]], top_k: int = 3) -> List[str]:
    """Find most relevant chunks for the query using semantic search."""
    # Get query embedding
    query_response = client.embeddings.create(
        model="text-embedding-3-small",
        input=query,
        encoding_format="float"
    )
    query_embedding = query_response.data[0].embedding
    
    # Calculate cosine similarity
    similarities = []
    for chunk_embedding in embeddings:
        similarity = np.dot(query_embedding, chunk_embedding) / (
            np.linalg.norm(query_embedding) * np.linalg.norm(chunk_embedding)
        )
        similarities.append(similarity)
    
    # Get indices of top K chunks
    top_indices = np.argsort(similarities)[-top_k:][::-1]
    
    # Return top K chunks
    return [chunks[i] for i in top_indices]

# Generate a response using OpenAI's API
def generate_response(query: str, context_chunks: List[str], chat_history: List[Dict[str, str]]) -> str:
    """Generate a response using OpenAI's API with context and chat history."""
    # Combine context chunks
    context_text = "\n\n".join([f"Chunk {i+1}:\n{chunk}" for i, chunk in enumerate(context_chunks)])
    
    # Create system prompt with guidelines
    system_prompt = f"""You are a document assistant that helps users understand their documents.
Answer the user's question based ONLY on the following context information extracted from their document.
If the answer cannot be found in the context, say so clearly but try to provide helpful related information if possible.
Do not make up or hallucinate information not contained in the context.

CONTEXT:
{context_text}
"""
    
    # Prepare messages for the API call
    messages = [{"role": "system", "content": system_prompt}]
    
    # Add chat history (up to 5 most recent messages)
    if chat_history:
        for msg in chat_history[-10:]:
            messages.append({"role": msg["role"], "content": msg["content"]})
    
    # Add the user's current question
    messages.append({"role": "user", "content": query})
    
    # Call the OpenAI API
    response = client.chat.completions.create(
        model="gpt-4-turbo",
        messages=messages,
        temperature=0.5,
        max_tokens=500
    )
    
    return response.choices[0].message.content

@app.post("/documents/upload/")
async def upload_document(file: UploadFile = File(...)):
    """Upload and process a document."""
    try:
        # Generate unique document ID
        doc_id = str(uuid.uuid4())
        
        # Create temporary file to store the uploaded file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
            temp_file.write(await file.read())
            temp_file_path = temp_file.name
        
        # Extract text from document
        text = extract_text(temp_file_path)
        
        # Clean up the temporary file
        os.unlink(temp_file_path)
        
        # Split text into chunks
        chunks = chunk_text(text)
        
        # Create embeddings for chunks
        embeddings = create_embeddings(chunks)
        
        # Store document data
        document_store[doc_id] = {
            "filename": file.filename,
            "upload_time": datetime.now().isoformat(),
            "text_length": len(text),
            "chunks": chunks,
            "embeddings": embeddings,
            "num_chunks": len(chunks)
        }
        
        return {
            "document_id": doc_id,
            "filename": file.filename,
            "num_chunks": len(chunks),
            "status": "processed"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@app.post("/qa/", response_model=Answer)
async def answer_question(question_data: Question):
    """Answer a question about a document."""
    import time
    start_time = time.time()
    
    doc_id = question_data.document_id
    
    # Check if document exists
    if doc_id not in document_store:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        # Get document data
        doc_data = document_store[doc_id]
        
        # Find relevant chunks using semantic search
        context_chunks = semantic_search(
            question_data.question, 
            doc_data["chunks"], 
            doc_data["embeddings"]
        )
        
        # Generate answer
        answer = generate_response(
            question_data.question,
            context_chunks,
            question_data.chat_history
        )
        
        processing_time = time.time() - start_time
        
        return {
            "answer": answer,
            "context": context_chunks,
            "processing_time": processing_time
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error answering question: {str(e)}")

# Run the application
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)