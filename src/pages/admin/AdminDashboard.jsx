import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { FaChartLine, FaUsers, FaBook, FaMoneyBillWave, FaCog } from 'react-icons/fa';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalUsers: 0,
    totalLessons: 0,
    revenue: 0
  });
  const [recentCourses, setRecentCourses] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, coursesRes, usersRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/courses/recent'),
          api.get('/admin/users/recent')
        ]);
        
        setStats(statsRes.data);
        setRecentCourses(coursesRes.data);
        setRecentUsers(usersRes.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <FaBook className="text-xl" />
            </div>
            <div>
              <p className="text-gray-500">Total Courses</p>
              <p className="text-2xl font-bold">{stats.totalCourses}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <FaUsers className="text-xl" />
            </div>
            <div>
              <p className="text-gray-500">Total Users</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <FaChartLine className="text-xl" />
            </div>
            <div>
              <p className="text-gray-500">Total Lessons</p>
              <p className="text-2xl font-bold">{stats.totalLessons}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <FaMoneyBillWave className="text-xl" />
            </div>
            <div>
              <p className="text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">${stats.revenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link 
          to="/admin/courses" 
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Manage Courses</h3>
            <FaBook className="text-blue-500 text-xl" />
          </div>
          <p className="text-gray-600 mt-2">Create, edit, and organize courses</p>
        </Link>
        
        <Link 
          to="/admin/users" 
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Manage Users</h3>
            <FaUsers className="text-green-500 text-xl" />
          </div>
          <p className="text-gray-600 mt-2">View and manage user accounts</p>
        </Link>
        
        <Link 
          to="/admin/settings" 
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">System Settings</h3>
            <FaCog className="text-purple-500 text-xl" />
          </div>
          <p className="text-gray-600 mt-2">Configure platform settings</p>
        </Link>
      </div>
      
      {/* Recent Courses */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Recent Courses</h2>
          <Link to="/admin/courses" className="text-indigo-600 hover:text-indigo-800 text-sm">
            View All
          </Link>
        </div>
        <div className="divide-y divide-gray-200">
          {recentCourses.length > 0 ? (
            recentCourses.map(course => (
              <Link 
                key={course.id} 
                to={`/admin/courses/${course._id}/lessons`}
                className="p-4 hover:bg-gray-50 transition block"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{course.title}</h3>
                    <p className="text-sm text-gray-500">{course.category} • {course.difficulty}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(course.created_at).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No courses found
            </div>
          )}
        </div>
      </div>
      
      {/* Recent Users */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Recent Users</h2>
          <Link to="/admin/users" className="text-indigo-600 hover:text-indigo-800 text-sm">
            View All
          </Link>
        </div>
        <div className="divide-y divide-gray-200">
          {recentUsers.length > 0 ? (
            recentUsers.map(user => (
              <div key={user.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium">{user.username}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No users found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;