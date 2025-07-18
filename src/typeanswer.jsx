import React, { useState } from 'react';

const TypeAnswer = ({ question, onSubmit }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = () => {
    if (!userAnswer.trim()) return;
    
    // Simple comparison - in a real app you might want more sophisticated checking
    const isCorrect = userAnswer.toLowerCase() === question.expectedAnswer.toLowerCase();
    
    setFeedback({
      isCorrect,
      correctAnswer: question.expectedAnswer
    });
    
    // Call the onSubmit callback after a short delay to show feedback
    setTimeout(() => {
      onSubmit(isCorrect);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="type-answer">
      <p className="question-text">{question.text}</p>
      
      <div className="answer-section">
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your answer here..."
          disabled={feedback !== null}
        />
        <button 
          onClick={handleSubmit}
          disabled={!userAnswer.trim() || feedback !== null}
        >
          Submit
        </button>
      </div>

      {feedback && (
        <div className={`feedback ${feedback.isCorrect ? 'correct' : 'incorrect'}`}>
          {feedback.isCorrect ? (
            <p>✅ Correct! Well done!</p>
          ) : (
            <p>❌ Incorrect. The correct answer was: <strong>{feedback.correctAnswer}</strong></p>
          )}
        </div>
      )}
    </div>
  );
};

export default TypeAnswer;