import React, { useState } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [languages, setLanguages] = useState([]);
  const [newLanguage, setNewLanguage] = useState('');
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [questionType, setQuestionType] = useState('mcq');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [expectedAnswer, setExpectedAnswer] = useState('');
  
  const addLanguage = async () => {
    if (!newLanguage.trim()) return;
    
    try {
      await axios.post('/api/languages', { name: newLanguage });
      setLanguages([...languages, newLanguage]);
      setNewLanguage('');
    } catch (error) {
      console.error('Error adding language:', error);
    }
  };
  
  const createLesson = async () => {
    if (!currentLesson || !currentLesson.title || !currentLesson.language) return;
    
    try {
      const response = await axios.post('/api/lessons/create', currentLesson);
      setLessons([...lessons, response.data]);
      setCurrentLesson({ ...currentLesson, questions: [] });
    } catch (error) {
      console.error('Error creating lesson:', error);
    }
  };
  
  const addQuestion = () => {
    if (!questionText.trim()) return;
    
    const newQuestion = { type: questionType, text: questionText };
    
    if (questionType === 'mcq') {
      newQuestion.options = options;
      newQuestion.correctAnswer = options[correctAnswer];
    } else if (questionType === 'type' || questionType === 'voice') {
      newQuestion.expectedAnswer = expectedAnswer;
    }
    
    setCurrentLesson({
      ...currentLesson,
      questions: [...(currentLesson?.questions || []), newQuestion]
    });
    
    // Reset form
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectAnswer(0);
    setExpectedAnswer('');
  };
  
  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      <div className="admin-section">
        <h2>Languages</h2>
        <div className="language-controls">
          <input
            type="text"
            value={newLanguage}
            onChange={(e) => setNewLanguage(e.target.value)}
            placeholder="New language"
          />
          <button onClick={addLanguage}>Add Language</button>
        </div>
        
        <div className="language-list">
          {languages.map((lang, index) => (
            <div key={index} className="language-item">{lang}</div>
          ))}
        </div>
      </div>
      
      <div className="admin-section">
        <h2>Create Lesson</h2>
        <div className="lesson-form">
          <input
            type="text"
            value={currentLesson?.title || ''}
            onChange={(e) => setCurrentLesson({
              ...currentLesson,
              title: e.target.value
            })}
            placeholder="Lesson title"
          />
          
          <select
            value={currentLesson?.language || ''}
            onChange={(e) => setCurrentLesson({
              ...currentLesson,
              language: e.target.value
            })}
          >
            <option value="">Select Language</option>
            {languages.map((lang, index) => (
              <option key={index} value={lang}>{lang}</option>
            ))}
          </select>
          
          <button onClick={createLesson}>Create Lesson</button>
        </div>
        
        {currentLesson && (
          <div className="questions-section">
            <h3>Add Questions</h3>
            
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
            >
              <option value="mcq">Multiple Choice</option>
              <option value="type">Type Answer</option>
              <option value="voice">Voice Practice</option>
            </select>
            
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Question text"
            />
            
            {questionType === 'mcq' && (
              <div className="mcq-options">
                {options.map((option, index) => (
                  <div key={index} className="option-input">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...options];
                        newOptions[index] = e.target.value;
                        setOptions(newOptions);
                      }}
                      placeholder={`Option ${index + 1}`}
                    />
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={correctAnswer === index}
                      onChange={() => setCorrectAnswer(index)}
                    />
                  </div>
                ))}
              </div>
            )}
            
            {(questionType === 'type' || questionType === 'voice') && (
              <input
                type="text"
                value={expectedAnswer}
                onChange={(e) => setExpectedAnswer(e.target.value)}
                placeholder="Expected answer"
              />
            )}
            
            <button onClick={addQuestion}>Add Question</button>
            
            <div className="questions-list">
              <h4>Current Questions ({currentLesson.questions?.length || 0})</h4>
              {currentLesson.questions?.map((q, index) => (
                <div key={index} className="question-item">
                  <p>{q.text} ({q.type})</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;