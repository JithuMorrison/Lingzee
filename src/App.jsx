import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import { FaSearch, FaLanguage, FaLaptopCode, FaCalculator, FaFlask, FaHistory } from 'react-icons/fa';
import './HomePage.css';

const HomePage = () => {
  const [courses, setCourses] = useState([]);
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, featuredRes] = await Promise.all([
          api.get('/courses'),
          api.get('/courses/featured')
        ]);
        
        setCourses(coursesRes.data);
        setFeaturedCourses(featuredRes.data);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(coursesRes.data.map(course => course.category))];
        setCategories(uniqueCategories);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Language': return <FaLanguage />;
      case 'Computer Science': return <FaLaptopCode />;
      case 'Math': return <FaCalculator />;
      case 'Science': return <FaFlask />;
      case 'History': return <FaHistory />;
      default: return <FaLanguage />;
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEnroll = async (courseId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      await api.post(`/courses/enroll/${courseId}`);
      navigate(`/courses/${courseId}`);
    } catch (error) {
      console.error('Error enrolling:', error);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading courses...</div>;
  }

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Learn Anything, Anytime, Anywhere</h1>
        <p>Interactive learning with your personal AI assistant</p>
        
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search for courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="search-button">
            <FaSearch />
          </button>
        </div>
      </div>

      <div className="category-filter">
        <button 
          className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          All Categories
        </button>
        
        {categories.map(category => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {getCategoryIcon(category)} {category}
          </button>
        ))}
      </div>

      {featuredCourses.length > 0 && (
        <div className="featured-section">
          <h2>Featured Courses</h2>
          <div className="featured-courses">
            {featuredCourses.map(course => (
              <div key={course.id} className="featured-course-card">
                <div className="course-thumbnail">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} />
                  ) : (
                    <div className="thumbnail-placeholder">
                      {getCategoryIcon(course.category)}
                    </div>
                  )}
                </div>
                <div className="course-info">
                  <h3>{course.title}</h3>
                  <p className="course-description">{course.description}</p>
                  <div className="course-meta">
                    <span className="category">{course.category}</span>
                    <span className="difficulty">{course.difficulty}</span>
                  </div>
                  <button 
                    className="enroll-btn"
                    onClick={() => user ? handleEnroll(course.id) : navigate(`/courses/${course.id}`)}
                  >
                    {user ? 'Start Learning' : 'View Course'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="all-courses-section">
        <h2>All Courses</h2>
        {filteredCourses.length === 0 ? (
          <div className="no-courses">No courses found matching your search</div>
        ) : (
          <div className="course-grid">
            {filteredCourses.map(course => (
              <div key={course.id} className="course-card">
                <div className="card-thumbnail">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} />
                  ) : (
                    <div className="thumbnail-placeholder">
                      {getCategoryIcon(course.category)}
                    </div>
                  )}
                </div>
                <div className="card-content">
                  <h3>{course.title}</h3>
                  <p className="card-description">{course.description.substring(0, 100)}...</p>
                  <div className="card-footer">
                    <span className="lesson-count">{course.lesson_count} lessons</span>
                    <button 
                      className="view-btn"
                      onClick={() => navigate(`/courses/${course.id}`)}
                    >
                      View Course
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;