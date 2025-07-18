import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import MCQQuestion from './mcq';
import TypeAnswer from './typeanswer';
import VoicePractice from './voicepractice';
import LessonProgress from './lessonprogress';

const LessonPractice = ({ updateProgress }) => {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  
  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const response = await axios.get(`/api/lessons?id=${id}`);
        setLesson(response.data);
      } catch (error) {
        console.error('Error fetching lesson:', error);
      }
    };
    
    fetchLesson();
  }, [id]);
  
  const handleAnswerSubmit = (isCorrect) => {
    if (isCorrect) {
      setScore(prev => prev + 10); // 10 points per correct answer
    }
    
    if (currentQuestion < lesson.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setCompleted(true);
      submitLessonResults();
    }
  };
  
  const submitLessonResults = async () => {
    try {
      await axios.post('/api/lessons/submit', {
        user_id: 'current_user', // Replace with actual user ID
        lesson_id: id,
        score: score
      });
      
      updateProgress(prev => ({
        ...prev,
        xp: (prev.xp || 0) + score,
        lessons_completed: {
          ...prev.lessons_completed,
          [id]: (prev.lessons_completed?.[id] || 0) + 1
        }
      }));
    } catch (error) {
      console.error('Error submitting lesson results:', error);
    }
  };
  
  if (!lesson) return <div>Loading...</div>;
  
  if (completed) {
    return (
      <div className="lesson-completed">
        <h2>Lesson Completed!</h2>
        <p>You earned {score} XP</p>
        <div className="xp-bar">
          <div style={{ width: `${Math.min(score, 100)}%` }}></div>
        </div>
        <button onClick={() => window.location.href = '/lessons'}>Back to Lessons</button>
      </div>
    );
  }
  
  const currentQ = lesson.questions[currentQuestion];
  
  return (
    <div className="lesson-practice">
      <LessonProgress 
        current={currentQuestion + 1} 
        total={lesson.questions.length} 
        score={score}
      />
      
      <div className="lesson-content">
        <h3>{lesson.title} - {currentQ.type}</h3>
        
        {currentQ.type === 'mcq' && (
          <MCQQuestion 
            question={currentQ} 
            onSubmit={handleAnswerSubmit}
          />
        )}
        
        {currentQ.type === 'type' && (
          <TypeAnswer 
            question={currentQ} 
            onSubmit={handleAnswerSubmit}
          />
        )}
        
        {currentQ.type === 'voice' && (
          <VoicePractice 
            question={currentQ} 
            onSubmit={handleAnswerSubmit}
            language={lesson.language}
          />
        )}
      </div>
    </div>
  );
};

export default LessonPractice;