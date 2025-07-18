import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LanguageSelection = ({ setCurrentLanguage }) => {
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await axios.get('/api/languages');
        setLanguages(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching languages:', error);
        setLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    setCurrentLanguage(language);
  };

  const startLearning = () => {
    if (selectedLanguage) {
      navigate('/dashboard');
    }
  };

  if (loading) {
    return <div className="loading">Loading languages...</div>;
  }

  return (
    <div className="language-selection">
      <h1>Choose a Language to Learn</h1>
      <div className="language-grid">
        {languages.map((language) => (
          <div
            key={language._id}
            className={`language-card ${selectedLanguage === language.name ? 'selected' : ''}`}
            onClick={() => handleLanguageSelect(language.name)}
          >
            <div className="language-flag">{language.flag || '🌐'}</div>
            <h3>{language.name}</h3>
            <p>{language.learners} learners</p>
          </div>
        ))}
      </div>
      <button
        className="start-button"
        onClick={startLearning}
        disabled={!selectedLanguage}
      >
        Start Learning {selectedLanguage || ''}
      </button>
    </div>
  );
};

export default LanguageSelection;