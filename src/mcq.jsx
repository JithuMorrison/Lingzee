import React, { useState } from 'react';

const MCQQuestion = ({ question, onSubmit }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  
  const handleSubmit = () => {
    const isCorrect = selectedOption === question.correctAnswer;
    onSubmit(isCorrect);
  };
  
  return (
    <div className="mcq-question">
      <p>{question.text}</p>
      
      <div className="options">
        {question.options.map((option, index) => (
          <div 
            key={index}
            className={`option ${selectedOption === option ? 'selected' : ''}`}
            onClick={() => setSelectedOption(option)}
          >
            {option}
          </div>
        ))}
      </div>
      
      <button 
        onClick={handleSubmit}
        disabled={!selectedOption}
      >
        Submit
      </button>
    </div>
  );
};

export default MCQQuestion;