import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authcontext';
import api from '../../services/api';
import { FaSearch, FaLanguage, FaLaptopCode, FaCalculator, FaFlask, FaHistory } from 'react-icons/fa';

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
      case 'Language': return <FaLanguage className="inline mr-2" />;
      case 'Computer Science': return <FaLaptopCode className="inline mr-2" />;
      case 'Math': return <FaCalculator className="inline mr-2" />;
      case 'Science': return <FaFlask className="inline mr-2" />;
      case 'History': return <FaHistory className="inline mr-2" />;
      default: return <FaLanguage className="inline mr-2" />;
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
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="bg-indigo-600 text-white rounded-xl p-8 mb-8">
        <h1 className="text-4xl font-bold mb-4">Learn Anything, Anytime, Anywhere</h1>
        <p className="text-xl mb-6">Interactive learning with your personal AI assistant</p>
        
        <div className="flex max-w-2xl">
          <input
            type="text"
            placeholder="Search for courses..."
            className="flex-1 px-4 py-3 rounded-l-lg focus:outline-none text-gray-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="bg-indigo-800 px-6 rounded-r-lg hover:bg-indigo-900 transition">
            <FaSearch className="text-xl" />
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button 
          className={`px-4 py-2 rounded-full ${selectedCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          onClick={() => setSelectedCategory('all')}
        >
          All Categories
        </button>
        
        {categories.map(category => (
          <button
            key={category}
            className={`px-4 py-2 rounded-full flex items-center ${selectedCategory === category ? 'bg-indigo-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            onClick={() => setSelectedCategory(category)}
          >
            {getCategoryIcon(category)} {category}
          </button>
        ))}
      </div>

      {/* Featured Courses */}
      {featuredCourses.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Featured Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.map(course => (
              <div key={course.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="h-48 bg-gray-200 overflow-hidden">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600">
                      {getCategoryIcon(course.category)}
                      <span className="text-lg font-medium">{course.category}</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                      {course.category}
                    </span>
                    <span className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded-full">
                      {course.difficulty}
                    </span>
                  </div>
                  <button 
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
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

      {/* All Courses */}
      <div>
        <h2 className="text-2xl font-bold mb-6">All Courses</h2>
        {filteredCourses.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-600">No courses found matching your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map(course => (
              <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="h-40 bg-gray-200 overflow-hidden">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600">
                      {getCategoryIcon(course.category)}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-1 line-clamp-1">{course.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{course.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      {course.lesson_count} lessons
                    </span>
                    <button 
                      className="text-sm bg-white text-indigo-600 border border-indigo-600 px-3 py-1 rounded hover:bg-indigo-50 transition"
                      onClick={() => navigate(`/courses/${course.id}`)}
                    >
                      View
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