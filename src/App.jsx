import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { AssistantProvider } from './context/AssistantContext';
import PrivateRoute from './components/Common/PrivateRoute';
import AdminRoute from './components/Common/AdminRoute';
import HomePage from './pages/Home/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import CoursePage from './pages/Course/CoursePage';
import LessonPage from './pages/Lesson/LessonPage';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminCourses from './pages/Admin/AdminCourses';
import AdminLessons from './pages/Admin/AdminLessons';
import Layout from './components/Common/Layout';
import Assistant from './components/Assistant/Assistant';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AssistantProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
              <Route path="/courses/:id" element={<PrivateRoute><CoursePage /></PrivateRoute>} />
              <Route path="/lessons/:id" element={<PrivateRoute><LessonPage /></PrivateRoute>} />
              
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/courses" element={<AdminRoute><AdminCourses /></AdminRoute>} />
              <Route path="/admin/courses/:id/lessons" element={<AdminRoute><AdminLessons /></AdminRoute>} />
            </Routes>
            
            <Assistant />
          </Layout>
        </AssistantProvider>
      </AuthProvider>
      
      <ToastContainer position="bottom-right" autoClose={5000} />
    </Router>
  );
}

export default App;