import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from'./authcontext';

const Navbar = ({ currentLanguage, setCurrentLanguage }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="logo">
          LinguaLearn
        </Link>
        {currentLanguage && (
          <span className="current-language">
            Learning: {currentLanguage}
          </span>
        )}
      </div>

      <div className="navbar-center">
        {user && (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/lessons">Lessons</Link>
            {user.role === 'admin' && (
              <Link to="/admin">Admin</Link>
            )}
          </>
        )}
      </div>

      <div className="navbar-right">
        {user ? (
          <>
            <div className="user-info">
              <span className="username">{user.username}</span>
              <span className="user-xp">{user.xp} XP</span>
            </div>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="login-button">
              Login
            </Link>
            <Link to="/register" className="register-button">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;