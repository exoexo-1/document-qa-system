import React, { useState, useRef, useEffect } from 'react';
import { Upload, MessageSquare, Search } from 'lucide-react';
import { simulateDocumentUpload, simulateAskQuestion } from './services/api';
import './App.css';

// Main application component
function App() {
  // State management
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [ready, setReady] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // State for document ID
  const [documentId, setDocumentId] = useState(null);
  
  // Document processing function
  const processDocument = async (uploadedFile) => {
    if (!uploadedFile) return;
    
    setProcessing(true);
    
    try {
      // Use the simulated API function (replace with real API when backend is ready)
      const response = await simulateDocumentUpload(uploadedFile);
      
      setDocumentId(response.document_id);
      setReady(true);
      setMessages([{
        role: 'system',
        content: `Document "${uploadedFile.name}" has been processed with ${response.num_chunks} chunks. You can now ask questions about its content.`
      }]);
    } catch (error) {
      setMessages([{
        role: 'system',
        content: `Error processing document: ${error.message}`
      }]);
    } finally {
      setProcessing(false);
    }
  };
  
  // Submit question handler
  const handleSubmitQuestion = async () => {
    if (!question.trim() || !ready) return;
    
    // Add user question to chat
    const userQuestion = question;
    setMessages(prev => [...prev, {
      role: 'user',
      content: userQuestion
    }]);
    
    setQuestion('');
    setIsTyping(true);
    
    try {
      // Prepare chat history for context (excluding system messages)
      const chatHistory = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({ role: msg.role, content: msg.content }));
      
      // Use the simulated API function (replace with real API when backend is ready)
      const response = await simulateAskQuestion(userQuestion);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.answer
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'system',
        content: `Error: ${error.message}`
      }]);
    } finally {
      setIsTyping(false);
    }
  };
  

  
  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      processDocument(selectedFile);
    }
  };

  // Handle key press for question input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmitQuestion();
    }
  };
  
  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <h1>Document Q&A System</h1>
        <p>Powered by AI for intelligent document analysis</p>
      </header>
      
      {/* Main content */}
      <main className="app-main">
        {/* Document upload area */}
        {!file && !processing && (
          <div className="upload-area">
            <Upload size={48} className="upload-icon" />
            <h2>Upload a Document</h2>
            <p>
              Upload a text document (PDF, DOCX, TXT) to analyze and ask questions about
            </p>
            <label className="upload-button">
              Select Document
              <input 
                type="file" 
                accept=".pdf,.docx,.txt" 
                className="hidden-input" 
                onChange={handleFileChange}
              />
            </label>
          </div>
        )}
        
        {/* Processing indicator */}
        {processing && (
          <div className="processing-indicator">
            <div className="spinner"></div>
            <p>Processing document...</p>
            <p className="processing-detail">Analyzing content and generating embeddings</p>
          </div>
        )}
        
        {/* Chat interface */}
        {(ready || messages.length > 0) && (
          <div className="chat-container">
            <div className="chat-messages">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`chat-message ${msg.role}`}
                >
                  {msg.content}
                </div>
              ))}
              {isTyping && (
                <div className="chat-message assistant typing">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            {/* Question input */}
            <div className="question-input">
              <input
                ref={inputRef}
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about the document..."
                disabled={!ready}
              />
              <button 
                onClick={handleSubmitQuestion}
                className={!ready || !question.trim() ? 'disabled' : ''}
                disabled={!ready || !question.trim()}
              >
                <Search size={20} />
              </button>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer with system info */}
      <footer className="app-footer">
        <div className="footer-content">
          <div>
            <strong>System:</strong> Document Q&A with RAG Architecture
          </div>
          {file && (
            <div>
              <strong>Document:</strong> {file.name}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

export default App;