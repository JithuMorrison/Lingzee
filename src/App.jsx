import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/authcontext';
import { AssistantProvider } from './context/AssistantContext';
import { SocketProvider } from './context/SocketContext'; // ✅ Add this import
import PrivateRoute from './components/common/privateroute';
import AdminRoute from './components/common/adminroute';
import HomePage from './pages/home/homepage';
import LoginPage from './pages/auth/loginpage';
import RegisterPage from './pages/auth/registerpage';
import DashboardPage from './pages/dashboard/DashboardPage';
import CoursePage from './pages/courses/CoursePage';
import LessonPage from './pages/lesson/lessonpage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCourses from './pages/admin/AdminCourses';
import AdminLessons from './pages/admin/AdminLessons';
import Layout from './components/common/layout';
import Assistant from './components/assistant/Assistant';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider> {/* ✅ Added SocketProvider */}
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
        </SocketProvider>
      </AuthProvider>
      
      <ToastContainer position="bottom-right" autoClose={5000} />
    </Router>
  );
}

export default App;
