import React from 'react';

const LessonProgress = ({ current, total, score }) => {
  const progressPercentage = (current / total) * 100;

  return (
    <div className="lesson-progress">
      <div className="progress-header">
        <h4>Progress</h4>
        <span className="score">Score: {score} XP</span>
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      <div className="progress-info">
        <span>Question {current} of {total}</span>
        <span>{Math.round(progressPercentage)}% complete</span>
      </div>
    </div>
  );
};

export default LessonProgress;