import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FaPlus, FaEdit, FaTrash, FaArrowLeft, FaVideo, FaFileAlt, FaQuestionCircle, FaBook } from 'react-icons/fa';
import { toast } from 'react-toastify';

const AdminLessons = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    lesson_type: 'video',
    content: '',
    duration: 0,
    is_free: true,
    order: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (id) {
          const [courseRes, lessonsRes] = await Promise.all([
            api.get(`/admin/courses/${id}`),
            api.get(`/admin/courses/${id}/lessons`)
          ]);
          
          setCourse(courseRes.data);
          setLessons(lessonsRes.data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleContentChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const lessonData = {
        ...formData,
        course_id: id
      };
      
      if (formData.lesson_type === 'video') {
        lessonData.content = {
          video_id: formData.content.video_id || '',
          notes: formData.content.notes || ''
        };
      } else if (formData.lesson_type === 'quiz') {
        lessonData.content = {
          questions: formData.content.questions || []
        };
      } else if (formData.lesson_type === 'document') {
        lessonData.content = {
          url: formData.content.url || ''
        };
      } else {
        lessonData.content = formData.content || '';
      }
      
      const response = await api.post(`/admin/courses/${id}/lessons`, lessonData);
      setLessons(prev => [...prev, response.data]);
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        lesson_type: 'video',
        content: '',
        duration: 0,
        is_free: true,
        order: 0
      });
      toast.success('Lesson created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error creating lesson');
    }
  };

  const handleDelete = async (lessonId) => {
    if (window.confirm('Are you sure you want to delete this lesson?')) {
      try {
        await api.delete(`/admin/lessons/${lessonId}`);
        setLessons(prev => prev.filter(lesson => lesson._id !== lessonId));
        toast.success('Lesson deleted successfully!');
      } catch (error) {
        toast.error('Error deleting lesson');
      }
    }
  };

  const getLessonIcon = (lessonType) => {
    switch (lessonType) {
      case 'video': return <FaVideo className="text-blue-500" />;
      case 'quiz': return <FaQuestionCircle className="text-yellow-500" />;
      case 'document': return <FaFileAlt className="text-green-500" />;
      default: return <FaBook className="text-gray-500" />;
    }
  };

  const renderContentForm = () => {
    switch (formData.lesson_type) {
      case 'video':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="video_id" className="block text-sm font-medium text-gray-700">
                YouTube Video ID
              </label>
              <input
                type="text"
                id="video_id"
                name="video_id"
                value={formData.content?.video_id || ''}
                onChange={handleContentChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g. dQw4w9WgXcQ"
              />
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Lesson Notes (HTML)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.content?.notes || ''}
                onChange={handleContentChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        );
      case 'quiz':
        return (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              You can add questions after creating the lesson.
            </p>
          </div>
        );
      case 'document':
        return (
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700">
              Document URL
            </label>
            <input
              type="url"
              id="url"
              name="url"
              value={formData.content?.url || ''}
              onChange={handleContentChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="https://example.com/document.pdf"
            />
          </div>
        );
      default:
        return (
          <div>
            <label htmlFor="text_content" className="block text-sm font-medium text-gray-700">
              Lesson Content (HTML)
            </label>
            <textarea
              id="text_content"
              name="text_content"
              rows={6}
              value={formData.content || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        );
    }
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
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/admin/courses')}
          className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
        >
          <FaArrowLeft className="mr-1" /> Back to Courses
        </button>
        <h1 className="text-2xl font-bold">Manage Lessons: {course.title}</h1>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">{lessons.length} lessons</p>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center"
        >
          <FaPlus className="mr-2" /> Add Lesson
        </button>
      </div>
      
      {lessons.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 mb-4">No lessons found for this course</p>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Add Your First Lesson
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lesson
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lessons.sort((a, b) => a.order - b.order).map(lesson => (
                <tr key={lesson.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center text-lg mr-3">
                        {getLessonIcon(lesson.lesson_type)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{lesson.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">{lesson.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                      {lesson.lesson_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lesson.duration} min
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      lesson.is_free ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {lesson.is_free ? 'Free' : 'Premium'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => navigate(`/admin/lessons/${lesson.id}/edit`)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4 flex items-center"
                    >
                      <FaEdit className="mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(lesson._id)}
                      className="text-red-600 hover:text-red-900 flex items-center"
                    >
                      <FaTrash className="mr-1" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Create Lesson Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-xl font-semibold">Create New Lesson</h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={2}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="lesson_type" className="block text-sm font-medium text-gray-700">
                      Lesson Type
                    </label>
                    <select
                      id="lesson_type"
                      name="lesson_type"
                      value={formData.lesson_type}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="video">Video</option>
                      <option value="text">Text</option>
                      <option value="quiz">Quiz</option>
                      <option value="document">Document</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      id="duration"
                      name="duration"
                      min="0"
                      value={formData.duration}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="is_free"
                    name="is_free"
                    type="checkbox"
                    checked={formData.is_free}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_free" className="ml-2 block text-sm text-gray-900">
                    Free Lesson
                  </label>
                </div>
                
                <div>
                  <label htmlFor="order" className="block text-sm font-medium text-gray-700">
                    Order
                  </label>
                  <input
                    type="number"
                    id="order"
                    name="order"
                    min="0"
                    value={formData.order}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div className="pt-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Lesson Content</h4>
                  {renderContentForm()}
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Create Lesson
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLessons;