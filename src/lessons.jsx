import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const Lessons = ({ currentLanguage }) => {
  const [lessons, setLessons] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await axios.get(`/api/lessons?language=${currentLanguage}`);
        setLessons(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching lessons:', error);
        setLoading(false);
      }
    };

    if (currentLanguage) {
      fetchLessons();
    }
  }, [currentLanguage]);

  const filteredLessons = lessons.filter(lesson => {
    // Filter by difficulty
    if (filter !== 'all' && lesson.difficulty !== filter) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm && 
        !lesson.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  if (loading) {
    return <div className="loading">Loading lessons...</div>;
  }

  return (
    <div className="lessons-page">
      <div className="lessons-header">
        <h1>{currentLanguage} Lessons</h1>
        
        <div className="filters">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          
          <input
            type="text"
            placeholder="Search lessons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="lessons-grid">
        {filteredLessons.length > 0 ? (
          filteredLessons.map(lesson => (
            <div key={lesson._id} className="lesson-card">
              <div className="lesson-header">
                <span className={`difficulty ${lesson.difficulty}`}>
                  {lesson.difficulty}
                </span>
                <span className="xp">+{lesson.xp} XP</span>
              </div>
              <h3>{lesson.title}</h3>
              <p>{lesson.description}</p>
              <div className="lesson-footer">
                <span>{lesson.questions.length} exercises</span>
                <button 
                  onClick={() => navigate(`/lesson/${lesson._id}`)}
                  className="start-button"
                >
                  Start
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-lessons">
            <p>No lessons found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lessons;