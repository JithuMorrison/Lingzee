import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { FaSearch, FaBook, FaStar, FaClock, FaLock } from 'react-icons/fa';

const DefaultCoursePage = () => {
  const [courses, setCourses] = useState([]);
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

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
      case 'Language': return <FaBook className="inline mr-2" />;
      case 'Computer Science': return <FaBook className="inline mr-2" />;
      case 'Math': return <FaBook className="inline mr-2" />;
      case 'Science': return <FaBook className="inline mr-2" />;
      case 'History': return <FaBook className="inline mr-2" />;
      default: return <FaBook className="inline mr-2" />;
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search and Filter Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold">Browse All Courses</h1>
          
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search courses..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
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
                  <Link 
                    to={`/courses/${course.id}`}
                    className="w-full block text-center bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
                  >
                    View Course
                  </Link>
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
                    <Link 
                      to={`/courses/${course.id}`}
                      className="text-sm bg-white text-indigo-600 border border-indigo-600 px-3 py-1 rounded hover:bg-indigo-50 transition"
                    >
                      View
                    </Link>
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

export default DefaultCoursePage;