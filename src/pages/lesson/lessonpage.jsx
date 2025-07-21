import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authcontext';
import { useAssistant } from '../../context/AssistantContext';
import api from '../../services/api';
import YouTube from 'react-youtube';
import { FaCheckCircle, FaArrowLeft, FaArrowRight, FaBookmark, FaLock } from 'react-icons/fa';
import { toast } from 'react-toastify';

const LessonPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setCurrentCourse } = useAssistant();
  const [lesson, setLesson] = useState(null);
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [videoProgress, setVideoProgress] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef(null);
  
  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const response = await api.get(`/lessons/${id}`);
        setLesson(response.data);
        
        const courseResponse = await api.get(`/courses/${response.data.course_id}`);
        setCourse(courseResponse.data);
        setCurrentCourse(courseResponse.data.id);
        
        if (user) {
          const [progressResponse, bookmarkResponse] = await Promise.all([
            api.get(`/progress/${response.data.course_id}/${id}`),
            api.get(`/bookmarks/${id}/check`)
          ]);
          
          if (progressResponse.data) {
            setProgress(progressResponse.data.progress);
            setIsCompleted(progressResponse.data.completed);
            if (response.data.lesson_type === 'video') {
              setVideoProgress(progressResponse.data.video_progress || 0);
            }
          }
          
          setIsBookmarked(bookmarkResponse.data.isBookmarked);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching lesson:', error);
        setIsLoading(false);
      }
    };
    
    fetchLesson();
  }, [id, user]);

  const handleVideoProgress = (event) => {
    const player = event.target;
    const duration = player.getDuration();
    const currentTime = player.getCurrentTime();
    const progress = (currentTime / duration) * 100;
    
    setVideoProgress(progress);
    
    if (progress % 10 < 1) {
      updateProgress(progress / 100);
    }
  };

  const updateProgress = async (newProgress) => {
    try {
      await api.post(`/progress/${course.id}/${lesson.id}`, {
        progress: newProgress,
        video_progress: lesson.lesson_type === 'video' ? newProgress : null
      });
      setProgress(newProgress);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const markAsCompleted = async () => {
    try {
      await api.post(`/progress/${course._id}/${lesson._id}/complete`);
      setIsCompleted(true);
      setProgress(1);
      
      if (user) {
        const pointsToAdd = Math.floor(lesson.duration * 2);
        await api.post(`/users/${user._id}/points`, { points: pointsToAdd });
        toast.success(`Earned ${pointsToAdd} points!`);
      }
    } catch (error) {
      console.error('Error marking lesson as completed:', error);
      toast.error('Failed to mark as completed');
    }
  };

  const handleQuizSubmit = async () => {
    try {
      const response = await api.post(`/lessons/${lesson.id}/quiz`, {
        answers: quizAnswers
      });
      
      if (response.data.correct) {
        const score = (response.data.correct / lesson.content.questions.length) * 100;
        await api.post(`/progress/${course.id}/${lesson.id}`, {
          quiz_score: score,
          progress: score >= 80 ? 1 : 0.5,
          completed: score >= 80
        });
        
        setIsCompleted(score >= 80);
        setProgress(score >= 80 ? 1 : 0.5);
        
        if (score >= 80 && user) {
          const pointsToAdd = Math.floor(lesson.duration * 2);
          await api.post(`/users/${user.id}/points`, { points: pointsToAdd });
          toast.success(`Quiz passed! Earned ${pointsToAdd} points`);
        } else if (score < 80) {
          toast.error(`Quiz score ${Math.round(score)}%. Need 80% to pass.`);
        }
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    }
  };

  const toggleBookmark = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      if (isBookmarked) {
        await api.delete(`/bookmarks/${id}`);
        toast.success('Removed from bookmarks');
      } else {
        await api.post(`/bookmarks`, { lesson_id: id });
        toast.success('Added to bookmarks');
      }
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmark');
    }
  };

  const navigateToLesson = (direction) => {
    const currentIndex = course.lessons.findIndex(l => l.id === lesson.id);
    if (direction === 'prev' && currentIndex > 0) {
      navigate(`/lessons/${course.lessons[currentIndex - 1].id}`);
    } else if (direction === 'next' && currentIndex < course.lessons.length - 1) {
      navigate(`/lessons/${course.lessons[currentIndex + 1].id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!lesson || !course) {
    return <div className="text-center py-12">Lesson not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigate(`/courses/${course.id}`)}
          className="flex items-center text-indigo-600 hover:text-indigo-800"
        >
          <FaArrowLeft className="mr-2" />
          Back to Course
        </button>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleBookmark}
            className={`flex items-center px-3 py-1 rounded-full ${isBookmarked ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <FaBookmark className="mr-1" />
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold">{lesson.title}</h1>
          <p className="text-gray-600">{course.title}</p>
        </div>
        
        <div className="p-4 border-b">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-indigo-600 h-2.5 rounded-full" 
              style={{ width: `${progress * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-sm text-gray-600">
              {Math.round(progress * 100)}% complete
            </span>
            {isCompleted && (
              <span className="text-sm text-green-600 flex items-center">
                <FaCheckCircle className="mr-1" /> Completed
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        {lesson.lesson_type === 'video' && (
          <div className="p-4">
            <div className="aspect-w-16 aspect-h-9 bg-black">
              <YouTube
                videoId={lesson.content.video_id}
                opts={{
                  height: '500',
                  width: '100%',
                  playerVars: {
                    autoplay: 0,
                    controls: 1,
                    start: Math.floor(videoProgress * lesson.content.duration / 100)
                  }
                }}
                onStateChange={handleVideoProgress}
                ref={videoRef}
                className="w-full"
              />
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Notes</h3>
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: lesson.content.notes || '<p>No notes available for this video.</p>' }} />
            </div>
          </div>
        )}
        
        {lesson.lesson_type === 'text' && (
          <div className="p-6 prose max-w-none" dangerouslySetInnerHTML={{ __html: lesson.content }} />
        )}
        
        {lesson.lesson_type === 'quiz' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Quiz: {lesson.title}</h2>
              <p className="text-gray-600">Score at least 80% to complete this lesson</p>
            </div>
            
            {lesson.content.questions.map((question, qIndex) => (
              <div key={qIndex} className="mb-8 p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-medium mb-3">{qIndex + 1}. {question.text}</h3>
                {question.type === 'mcq' && (
                  <div className="space-y-2">
                    {question.options.map((option, oIndex) => (
                      <label key={oIndex} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type={question.multiple ? 'checkbox' : 'radio'}
                          name={`question-${qIndex}`}
                          value={oIndex}
                          checked={quizAnswers[qIndex]?.includes(oIndex)}
                          onChange={(e) => {
                            const newAnswers = { ...quizAnswers };
                            if (question.multiple) {
                              newAnswers[qIndex] = newAnswers[qIndex] || [];
                              if (e.target.checked) {
                                newAnswers[qIndex].push(oIndex);
                              } else {
                                newAnswers[qIndex] = newAnswers[qIndex].filter(i => i !== oIndex);
                              }
                            } else {
                              newAnswers[qIndex] = [oIndex];
                            }
                            setQuizAnswers(newAnswers);
                          }}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}
                
                {question.type === 'typing' && (
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    rows={4}
                    value={quizAnswers[qIndex]?.[0] || ''}
                    onChange={(e) => {
                      const newAnswers = { ...quizAnswers };
                      newAnswers[qIndex] = [e.target.value];
                      setQuizAnswers(newAnswers);
                    }}
                    placeholder="Type your answer here..."
                  />
                )}
              </div>
            ))}
            
            <button 
              onClick={handleQuizSubmit}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              Submit Quiz
            </button>
          </div>
        )}
        
        {lesson.lesson_type === 'document' && (
          <div className="p-6">
            <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(lesson.content.url)}&embedded=true`}
                title={lesson.title}
                className="w-full h-full"
              />
            </div>
            <div className="flex justify-center">
              <a 
                href={lesson.content.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
              >
                Download Document
              </a>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-between">
        <button 
          onClick={() => navigateToLesson('prev')}
          disabled={course.lessons.findIndex(l => l.id === lesson.id) === 0}
          className={`flex items-center px-4 py-2 rounded-lg ${course.lessons.findIndex(l => l.id === lesson.id) === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          <FaArrowLeft className="mr-2" />
          Previous
        </button>
        
        {!isCompleted && lesson.lesson_type !== 'quiz' && (
          <button 
            onClick={markAsCompleted}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center"
          >
            Mark as Completed <FaCheckCircle className="ml-2" />
          </button>
        )}
        
        <button 
          onClick={() => navigateToLesson('next')}
          disabled={course.lessons.findIndex(l => l.id === lesson.id) === course.lessons.length - 1}
          className={`flex items-center px-4 py-2 rounded-lg ${course.lessons.findIndex(l => l.id === lesson.id) === course.lessons.length - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Next <FaArrowRight className="ml-2" />
        </button>
      </div>
    </div>
  );
};

export default LessonPage;