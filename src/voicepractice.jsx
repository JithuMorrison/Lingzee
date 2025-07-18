import React, { useState } from 'react';
import { useSpeechSynthesis } from 'react-speech-kit';

const VoicePractice = ({ question, onSubmit, language }) => {
  const [userResponse, setUserResponse] = useState('');
  const [isListening, setIsListening] = useState(false);
  const { speak } = useSpeechSynthesis();
  
  const handleListen = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Your browser does not support speech recognition.');
      return;
    }
    
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setUserResponse(transcript);
    };
    
    recognition.start();
  };
  
  const handleSubmit = () => {
    // Simple check - in a real app you'd want more sophisticated evaluation
    const isCorrect = userResponse.toLowerCase() === question.expectedAnswer.toLowerCase();
    onSubmit(isCorrect);
  };
  
  return (
    <div className="voice-practice">
      <p>{question.text}</p>
      
      <button onClick={() => speak({ text: question.text, lang: language })}>
        🔊 Hear Question
      </button>
      
      <div className="response-section">
        <button 
          onClick={handleListen}
          className={isListening ? 'listening' : ''}
        >
          {isListening ? 'Listening...' : '🎤 Record Answer'}
        </button>
        
        {userResponse && (
          <div className="user-response">
            <p>You said: {userResponse}</p>
          </div>
        )}
      </div>
      
      <button 
        onClick={handleSubmit}
        disabled={!userResponse}
      >
        Submit
      </button>
    </div>
  );
};

export default VoicePractice;