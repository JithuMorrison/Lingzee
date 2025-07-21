import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authcontext';
import api from '../../services/api';
import { FaBook, FaChevronRight, FaLock, FaPlay, FaCheck, FaStar } from 'react-icons/fa';

const CoursePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, enrolledRes, progressRes] = await Promise.all([
          api.get(`/courses/${id}`),
          user ? api.get(`/courses/${id}/enrollment`) : Promise.resolve({ data: { isEnrolled: false } }),
          user ? api.get(`/progress/${id}`) : Promise.resolve({ data: { progress: 0, completedLessons: [] } })
        ]);
        
        setCourse(courseRes.data);
        setIsEnrolled(enrolledRes.data.isEnrolled);
        setProgress(progressRes.data.progress);
        setCompletedLessons(progressRes.data.completedLessons);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching course data:', error);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id, user]);

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      await api.post(`/courses/enroll/${id}`);
      setIsEnrolled(true);
    } catch (error) {
      console.error('Error enrolling in course:', error);
    }
  };

  const getLessonIcon = (lessonType) => {
    switch (lessonType) {
      case 'video': return <FaPlay className="text-blue-500 mr-3" />;
      case 'quiz': return <FaStar className="text-yellow-500 mr-3" />;
      case 'document': return <FaBook className="text-green-500 mr-3" />;
      default: return <FaBook className="text-gray-500 mr-3" />;
    }
  };

  const isLessonCompleted = (lessonId) => {
    return completedLessons.includes(lessonId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!course) {
    return <div className="text-center py-12">Course not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="md:w-2/3">
          <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
          <p className="text-gray-600 mb-4">{course.description}</p>
          
          <div className="flex items-center space-x-4 mb-6">
            <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
              {course.category}
            </span>
            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
              {course.difficulty}
            </span>
            {isEnrolled && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                {Math.round(progress * 100)}% complete
              </span>
            )}
          </div>
          
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">What you'll learn</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {course.learning_outcomes?.map((outcome, index) => (
                <li key={index} className="flex items-start">
                  <FaCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="md:w-1/3">
          <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-4">
            {course.thumbnail ? (
              <img src={course.thumbnail} alt={course.title} className="w-full h-48 object-cover" />
            ) : (
              <div className="w-full h-48 bg-indigo-100 flex items-center justify-center text-indigo-600">
                <FaBook className="text-4xl" />
              </div>
            )}
            
            <div className="p-4">
              {isEnrolled ? (
                <>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                    <div 
                      className="bg-indigo-600 h-2.5 rounded-full" 
                      style={{ width: `${progress * 100}%` }}
                    ></div>
                  </div>
                  <button 
                    onClick={() => {console.log(course);
                      if(course.lesson[0]){
                      navigate(`/lessons/${course.lesson[0]}`);
                    }}}
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition mb-2"
                  >
                    Continue Learning
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={handleEnroll}
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition mb-2"
                  >
                    Enroll Now
                  </button>
                  {!course.is_free && (
                    <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">
                      Purchase Course (${course.price})
                    </button>
                  )}
                </>
              )}
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Lessons</span>
                  <span>{course.lessons.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span>{course.duration} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Language</span>
                  <span>English</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Course Content</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {course.lessons.map((lesson, index) => (
            <div 
              key={lesson.id} 
              className={`p-4 hover:bg-gray-50 cursor-pointer transition ${isEnrolled ? '' : 'opacity-70'}`}
              onClick={() => isEnrolled ? navigate(`/lessons/${lesson.id}`) : null}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getLessonIcon(lesson.lesson_type)}
                  <div>
                    <h3 className="font-medium">
                      {index + 1}. {lesson.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {lesson.lesson_type} • {lesson.duration} min
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  {isEnrolled ? (
                    isLessonCompleted(lesson.id) ? (
                      <span className="text-green-500 mr-3">
                        <FaCheck />
                      </span>
                    ) : (
                      <span className="text-gray-400 mr-3">
                        <FaChevronRight />
                      </span>
                    )
                  ) : (
                    <span className="text-gray-400 mr-3">
                      <FaLock />
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoursePage;