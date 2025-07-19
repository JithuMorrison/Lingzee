import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/authcontext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-indigo-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          LearnAI
        </Link>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link to="/dashboard" className="hover:bg-indigo-500 px-3 py-2 rounded">
                Dashboard
              </Link>
              {user.is_admin && (
                <Link to="/admin" className="hover:bg-indigo-500 px-3 py-2 rounded">
                  Admin
                </Link>
              )}
              <button 
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 px-3 py-2 rounded"
              >
                Logout
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span>{user.username}</span>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:bg-indigo-500 px-3 py-2 rounded">
                Login
              </Link>
              <Link 
                to="/register" 
                className="bg-white text-indigo-600 hover:bg-gray-100 px-3 py-2 rounded"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;