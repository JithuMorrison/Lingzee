import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ProgressChart from './progresschart';

const Dashboard = ({ currentLanguage, userProgress }) => {
  const [stats, setStats] = useState({
    streak: 0,
    xp: 0,
    lessonsCompleted: 0
  });
  const [recommendedLessons, setRecommendedLessons] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user stats
        const statsResponse = await axios.get(`/api/user/stats?language=${currentLanguage}`);
        setStats(statsResponse.data);

        // Fetch recommended lessons
        const lessonsResponse = await axios.get(`/api/lessons/recommended?language=${currentLanguage}`);
        setRecommendedLessons(lessonsResponse.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    if (currentLanguage) {
      fetchData();
    }
  }, [currentLanguage]);

  return (
    <div className="dashboard">
      <h1>Your {currentLanguage} Dashboard</h1>
      
      <div className="stats-container">
        <div className="stat-card">
          <h3>Current Streak</h3>
          <p className="stat-value">{stats.streak} days</p>
        </div>
        <div className="stat-card">
          <h3>Total XP</h3>
          <p className="stat-value">{stats.xp}</p>
        </div>
        <div className="stat-card">
          <h3>Lessons Completed</h3>
          <p className="stat-value">{stats.lessonsCompleted}</p>
        </div>
      </div>

      <ProgressChart xp={stats.xp} />

      <div className="recommended-lessons">
        <h2>Recommended Lessons</h2>
        <div className="lesson-cards">
          {recommendedLessons.map(lesson => (
            <Link to={`/lesson/${lesson._id}`} key={lesson._id} className="lesson-card">
              <h3>{lesson.title}</h3>
              <p>{lesson.description}</p>
              <div className="difficulty">{lesson.difficulty}</div>
              <div className="xp-reward">+{lesson.xp} XP</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="quick-actions">
        <Link to="/lessons" className="action-button">
          Browse All Lessons
        </Link>
        <button className="action-button">
          Practice Speaking
        </button>
      </div>
    </div>
  );
};

export default Dashboard;