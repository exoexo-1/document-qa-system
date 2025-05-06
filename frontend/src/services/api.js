import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Upload document to the backend
export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await apiClient.post('/documents/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

// Ask a question about a document
export const askQuestion = async (documentId, question, chatHistory = []) => {
  try {
    const response = await apiClient.post('/qa/', {
      document_id: documentId,
      question,
      chat_history: chatHistory,
    });
    return response.data;
  } catch (error) {
    console.error('Error asking question:', error);
    throw error;
  }
};

// For development/testing without a backend
export const simulateDocumentUpload = async (file) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    document_id: 'doc_' + Math.random().toString(36).substr(2, 9),
    filename: file.name,
    num_chunks: Math.floor(Math.random() * 20) + 10,
    status: 'processed'
  };
};

// For development/testing without a backend
export const simulateAskQuestion = async (question) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const lowerQuestion = question.toLowerCase();
  let answer;
  
  if (lowerQuestion.includes('architecture') || lowerQuestion.includes('how does this work')) {
    answer = "This system uses a Retrieval-Augmented Generation (RAG) architecture. It processes documents by splitting them into chunks, generating embeddings for semantic search, and then retrieves relevant context when answering questions. The LLM combines this retrieved context with the conversation history to generate accurate, contextually relevant responses.";
  } 
  else if (lowerQuestion.includes('author') || lowerQuestion.includes('who wrote')) {
    answer = "Based on the document analysis, the author appears to be Sarah Johnson, a data scientist with 8 years of experience in natural language processing and machine learning applications.";
  }
  else if (lowerQuestion.includes('summary') || lowerQuestion.includes('main points')) {
    answer = "The document discusses advances in large language models, focusing on three key areas: 1) Improvements in context window size, 2) Multimodal capabilities integrating text with images and audio, and 3) Fine-tuning techniques for specialized applications. It concludes with predictions about future developments in AI assistants and their impact on knowledge work.";
  }
  else if (lowerQuestion.includes('conclusion') || lowerQuestion.includes('findings')) {
    answer = "The document concludes that while LLMs have made remarkable progress, challenges remain in areas of factuality, reasoning, and alignment with human values. It suggests that hybrid systems combining neural approaches with symbolic reasoning may offer the most promising path forward for the next generation of AI systems.";
  }
  else {
    answer = "Based on the document content, I can tell you that this question relates to advanced language models and their applications. The document specifically mentions that these technologies are transforming how we interact with information, creating more intuitive and context-aware systems. Would you like me to elaborate on any specific aspect mentioned in the document?";
  }
  
  return {
    answer,
    context: ["This is a simulated context chunk for testing purposes.", "Another simulated context chunk with relevant information."],
    processing_time: Math.random() * 0.5 + 0.2
  };
};