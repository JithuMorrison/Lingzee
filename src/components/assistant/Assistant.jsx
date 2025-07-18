import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/authcontext';
import { useSocket } from '../../context/SocketContext';
import { useAssistant } from '../../context/AssistantContext';
import { FaMicrophone, FaStop, FaPaperPlane, FaRobot, FaTimes, FaMinus } from 'react-icons/fa';

const Assistant = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { isAssistantOpen, toggleAssistant, minimized, toggleMinimized } = useAssistant();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  
  const recognition = useRef(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      recognition.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';
      
      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };
      
      recognition.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
    }
  }, []);

  useEffect(() => {
    if (!socket || !isAssistantOpen) return;
    
    const handleMessage = (message) => {
      setMessages(prev => [...prev, message]);
      setIsTyping(false);
      speakMessage(message.content);
    };
    
    const handleQuestion = (question) => {
      setMessages(prev => [...prev, question]);
      setIsTyping(false);
      speakMessage(question.content);
    };
    
    const handleSessionData = (data) => {
      setMessages(data.messages);
      setSessionId(data.session_id);
    };
    
    const handleTyping = () => {
      setIsTyping(true);
    };
    
    socket.on('assistant_message', handleMessage);
    socket.on('assistant_question', handleQuestion);
    socket.on('session_data', handleSessionData);
    socket.on('assistant_typing', handleTyping);
    
    return () => {
      socket.off('assistant_message', handleMessage);
      socket.off('assistant_question', handleQuestion);
      socket.off('session_data', handleSessionData);
      socket.off('assistant_typing', handleTyping);
    };
  }, [socket, isAssistantOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const speakMessage = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    const newMessage = {
      sender: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    
    if (socket && sessionId) {
      socket.emit('user_message', {
        session_id: sessionId,
        message: inputMessage
      });
      setIsTyping(true);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognition.current.stop();
      setIsListening(false);
    } else {
      recognition.current.start();
      setIsListening(true);
    }
  };

  const startSession = () => {
    if (socket && user) {
      socket.emit('start_session');
    }
  };

  useEffect(() => {
    if (isAssistantOpen && user) {
      startSession();
    }
  }, [isAssistantOpen, user]);

  if (minimized) {
    return (
      <div 
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-indigo-700 transition z-50"
        onClick={toggleMinimized}
      >
        <FaRobot className="text-xl" />
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 w-80 bg-white rounded-lg shadow-xl flex flex-col z-50 transition-all duration-300 ${isAssistantOpen ? 'h-[500px] opacity-100' : 'h-0 opacity-0 overflow-hidden'}`}>
      <div className="bg-indigo-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center">
          <FaRobot className="mr-2" />
          <h3 className="font-medium">Learning Assistant</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleMinimized}
            className="text-white hover:text-gray-200"
          >
            <FaMinus />
          </button>
          <button 
            onClick={toggleAssistant}
            className="text-white hover:text-gray-200"
          >
            <FaTimes />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Hello{user ? ` ${user.username}` : ''}! How can I help you today?</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${message.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}
              >
                <p>{message.content}</p>
                <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-indigo-200' : 'text-gray-500'}`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t">
        <div className="flex items-center">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button
            onClick={toggleListening}
            className={`px-3 py-2 border-t border-b border-gray-300 ${isListening ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {isListening ? <FaStop /> : <FaMicrophone />}
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="bg-indigo-600 text-white rounded-r-lg px-4 py-2 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Assistant;