import './App.css'
import React, { useState, useRef, useEffect } from 'react'
import MessageBubble from './components/MessageBubble'
import ElfsAvatar from './components/ElfsAvatar';
import { useAuth } from './AuthContext';

interface Message {
  text: string;
  isUser: boolean;
}

interface EventParams {
  title: string;
  date: string;
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
  const { isAuthenticated, isLoading, login } = useAuth();
  
  // Change this later to match your flask backend
  const API_URL = 'http://localhost:5000/api';

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

    if (!input.trim()) return;

    // If the user is already in the process of creating events, we don't want to add a new message
    if (pendingEvents.length !== 0) {
      if (input.toLowerCase() === 'yes' || input.toLowerCase() === 'y') {
        await createPendingEvents();
      } else {
        addMessage("Event Creation Cancelled", false); //False since it's a bot message
        setPendingEvents([]);
    }
    setInput('');
    return;
    }

    addMessage(input, true);

    await processMessage(input);

    setInput('');
  }

  const addMessage = (text: string, isUser: boolean) => {
    setMessages((prevMessages) => [...prevMessages, { text, isUser }]);
  };

  const processMessage = async (message: string) => {
    setIsProcessing(true);

    try {
      const response = await fetch(`${API_URL}/process-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
        credentials: 'include',       // Maybe only used in development
    });

    const data = await response.json();

    if (data.response && data.response.includes('I parsed the following events')) {
      const eventsText = data.response;

      const eventDataRegex = /Event \d+: Title: ([^,]+), Date: ([^,]+), Start Time: ([^,]+), End Time: ([^,]+)(?:, Recurrence: ([^,]+))?(?:, Reminder: (\d+) minutes before)?/g;

      const events: EventParams[] = [];
      let match;
      while ((match = eventDataRegex.exec(eventsText)) !== null) {
        const [_, title, date, start_time, end_time, recurrence, reminder] = match;
          
          const event: EventParams = {
            title,
            date,
            start_time,
            end_time,
          };
          
          if (recurrence) event.recurrence = recurrence;
          if (reminder) event.reminder = parseInt(reminder);
          
          events.push(event);
        }

        setPendingEvents(events);
        addMessage(data.response, false);
      } else {
        addMessage(data.response, false);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      addMessage('Sorry, there was an error processing your message. Please try again.' + error, false);
    } finally {
      setIsProcessing(false);
    }
  };

  const createPendingEvents = async () => {
    if (!isAuthenticated) {
      addMessage('You need to authorize access to your Google Calendar first. I\'ll redirect you to the authorization page.', false);
      // Set a timeout to redirect to login after showing the message
      setTimeout(() => {
        login(createPendingEvents);
      }, 2000);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/create-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ events: pendingEvents }),
      });

      if (response.status === 401) {
        const data = await response.json();
        if (data.auth_required) {
          addMessage('Your session has expired. You need to authorize access to your Google Calendar again.', false);
          // Set a timeout to redirect to login after showing the message
          setTimeout(() => {
            login();
          }, 2000);
          return;
        }
      }
      
      const data = await response.json();
      
      if (data.success) {
        addMessage(`Successfully created ${pendingEvents.length} event(s) in your calendar.`, false);
      } else {
        addMessage(`Error creating events: ${data.results.map((r: any) => r.error).join(', ')}`, false);
      }
    } catch (error) {
      console.error('Error creating events:', error);
      addMessage('Sorry, there was an error creating your events. Please try again.', false);
    } finally {
      setPendingEvents([]);
    }
  };
  

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="loading-container">
          <ElfsAvatar size={48} />
          <h2>Loading EventElf...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <ElfsAvatar size={32} />
        <h1>EventElf</h1>
        {isAuthenticated && (
          <button className="auth-button" onClick={() => window.location.href = '/auth/logout'}>
            Sign Out
          </button>
        )}
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

          {isProcessing && (
            <div className="thinking-indicator">
              <ElfsAvatar size={24} />
              <div className="thinking-bubble">Thinking...</div>
            </div>
          )}

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
