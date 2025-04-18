import './App.css'
import React, { useState, useRef, useEffect } from 'react'
import MessageBubble from './components/MessageBubble'

interface Message {
  text: string;
  isUser: boolean;
}

interface EventParams {
  title: string;
  data: string;
  start_time: string;
  end_time: string;
  recurrence?: string;
  reminder?: number;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingEvents, setPendingEvents] = useState<EventParams[]>([]);
  const messagesEndRef  = useRef<HTMLDivElement>(null);
  
  // Change this later to match your flask backend
  const API_URL = '/api';

  useEffect(() => {
    setMessages([{
      text: "Hello! How can I assist you today?",
      isUser: false
    }]);
  }, []);

  useEffect(() => {
    // Scroll to the bottom of the chat container when a new message is added
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    return;
  }

  // Create different UI when it's loading

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>EventElf</h1>
      </header>

      <div className="chat-container">
        <div className="messages-container">
          {messages.map((msg, index) => (
            <MessageBubble
              key={index}
              message={msg.text}
              isUser={msg.isUser}
            />
          ))}

        <div ref={messagesEndRef} />
        </div>
        
        <form className="input-container" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            disabled={isProcessing}
          />
          <button type="submit" disabled={isProcessing || !input.trim()}>
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  );
}

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 2L11 13" stroke="#5a8262" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#5a8262" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default App
