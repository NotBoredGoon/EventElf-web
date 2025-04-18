import React from 'react';
import './MessageBubble.css';

interface MessageBubbleProps {
  message: string;
  isUser: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isUser }) => {
  return (
    <div className={`message-container ${isUser ? 'user-message' : 'bot-message'}`}>
      {!isUser}
      <div className={`message-bubble ${isUser ? 'user-bubble' : 'bot-bubble'}`}>
        {message}
      </div>
    </div>
  );
};

export default MessageBubble;