import axios from 'axios';
import { toast } from 'react-toastify';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle specific status codes
      if (error.response.status === 401) {
        // Unauthorized - token expired or invalid
        localStorage.removeItem('token');
        window.location.href = '/login';
        toast.error('Session expired. Please login again.');
      } else if (error.response.status === 403) {
        // Forbidden - no permission
        toast.error('You do not have permission to access this resource.');
      } else if (error.response.data?.error) {
        // Show server error message
        toast.error(error.response.data.error);
      } else {
        // Generic error message
        toast.error('An error occurred. Please try again.');
      }
    } else if (error.request) {
      // The request was made but no response was received
      toast.error('Network error. Please check your connection.');
    } else {
      // Something happened in setting up the request
      toast.error('Request error. Please try again.');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// Courses API
export const coursesAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getFeatured: () => api.get('/courses/featured'),
  getById: (id) => api.get(`/courses/${id}`),
  enroll: (id) => api.post(`/courses/enroll/${id}`),
  checkEnrollment: (id) => api.get(`/courses/${id}/enrollment`),
};

// Lessons API
export const lessonsAPI = {
  getById: (id) => api.get(`/lessons/${id}`),
  submitQuiz: (id, data) => api.post(`/lessons/${id}/quiz`, data),
};

// Progress API
export const progressAPI = {
  getCourseProgress: (courseId) => api.get(`/progress/${courseId}`),
  getLessonProgress: (courseId, lessonId) => api.get(`/progress/${courseId}/${lessonId}`),
  updateProgress: (courseId, lessonId, data) => api.post(`/progress/${courseId}/${lessonId}`, data),
  completeLesson: (courseId, lessonId) => api.post(`/progress/${courseId}/${lessonId}/complete`),
};

// User API
export const userAPI = {
  getDashboard: () => api.get('/users/dashboard'),
  getCourses: () => api.get('/users/courses'),
  getProgress: () => api.get('/users/progress'),
  getStats: () => api.get('/users/stats'),
  addPoints: (userId, data) => api.post(`/users/${userId}/points`, data),
};

// Assistant API
export const assistantAPI = {
  startSession: (courseId) => api.post('/assistant/session', { course_id: courseId }),
  sendMessage: (sessionId, message) => api.post('/assistant/message', { session_id: sessionId, message }),
  voiceInput: (audioFile) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    return api.post('/assistant/voice', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Admin API
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/stats'),
  getCourses: () => api.get('/admin/courses'),
  getRecentCourses: () => api.get('/admin/courses/recent'),
  getCourseById: (id) => api.get(`/admin/courses/${id}`),
  createCourse: (data) => api.post('/admin/courses', data),
  updateCourse: (id, data) => api.put(`/admin/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/admin/courses/${id}`),
  getLessons: (courseId) => api.get(`/admin/courses/${courseId}/lessons`),
  createLesson: (data) => api.post('/admin/lessons', data),
  updateLesson: (id, data) => api.put(`/admin/lessons/${id}`, data),
  deleteLesson: (id) => api.delete(`/admin/lessons/${id}`),
  getRecentUsers: () => api.get('/admin/users/recent'),
};

// Bookmark API
export const bookmarkAPI = {
  checkBookmark: (lessonId) => api.get(`/bookmarks/${lessonId}/check`),
  addBookmark: (data) => api.post('/bookmarks', data),
  removeBookmark: (lessonId) => api.delete(`/bookmarks/${lessonId}`),
};

export default api;