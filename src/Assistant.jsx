import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSpeechSynthesis } from 'react-speech-kit';

const Assistant = ({ currentLanguage, userProgress }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const { speak, cancel } = useSpeechSynthesis();
  const [suggestion, setSuggestion] = useState('');
  
  // Generate periodic suggestions
  useEffect(() => {
    if (!currentLanguage) return;
    
    const suggestionInterval = setInterval(() => {
      generateSuggestion();
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(suggestionInterval);
  }, [currentLanguage, userProgress]);
  
  const generateSuggestion = async () => {
    try {
      const response = await axios.post('/api/assistant/interact', {
        user_id: 'current_user', // Replace with actual user ID
        current_language: currentLanguage,
        progress: userProgress
      });
      
      if (response.data.action !== 'silent') {
        setSuggestion(response.data.text);
        speak({ text: response.data.text, lang: currentLanguage });
      }
    } catch (error) {
      console.error('Error generating suggestion:', error);
    }
  };
  
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = {
      text: input,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    try {
      const response = await axios.post('/api/assistant/interact', {
        user_id: 'current_user', // Replace with actual user ID
        message: input,
        current_language: currentLanguage
      });
      
      if (response.data.action !== 'silent') {
        const assistantMessage = {
          text: response.data.text,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, assistantMessage]);
        speak({ text: response.data.text, lang: currentLanguage });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  const handleListen = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Your browser does not support speech recognition.');
      return;
    }
    
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = currentLanguage;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    
    recognition.start();
  };
  
  return (
    <div className="assistant-container">
      <div className="assistant-header">
        <h3>Language Assistant</h3>
        {suggestion && (
          <div className="suggestion-bubble">
            <p>{suggestion}</p>
            <button onClick={() => speak({ text: suggestion, lang: currentLanguage })}>
              🔊
            </button>
          </div>
        )}
      </div>
      
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <p>{msg.text}</p>
            <span className="timestamp">{msg.timestamp}</span>
          </div>
        ))}
      </div>
      
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Type in ${currentLanguage}...`}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button onClick={handleListen} className={isListening ? 'listening' : ''}>
          🎤
        </button>
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Assistant;