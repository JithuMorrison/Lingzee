import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaBook, FaUser, FaCog, FaGraduationCap } from 'react-icons/fa';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100';
  };

  return (
    <div className="w-64 bg-white shadow-md hidden md:block">
      <div className="p-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Menu</h2>
        
        <nav>
          <ul className="space-y-2">
            <li>
              <Link 
                to="/dashboard" 
                className={`flex items-center p-3 rounded-lg ${isActive('/dashboard')}`}
              >
                <FaHome className="mr-3" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link 
                to="/courses" 
                className={`flex items-center p-3 rounded-lg ${isActive('/courses')}`}
              >
                <FaBook className="mr-3" />
                My Courses
              </Link>
            </li>
            <li>
              <Link 
                to="/progress" 
                className={`flex items-center p-3 rounded-lg ${isActive('/progress')}`}
              >
                <FaGraduationCap className="mr-3" />
                My Progress
              </Link>
            </li>
            <li>
              <Link 
                to="/profile" 
                className={`flex items-center p-3 rounded-lg ${isActive('/profile')}`}
              >
                <FaUser className="mr-3" />
                Profile
              </Link>
            </li>
            <li>
              <Link 
                to="/settings" 
                className={`flex items-center p-3 rounded-lg ${isActive('/settings')}`}
              >
                <FaCog className="mr-3" />
                Settings
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;