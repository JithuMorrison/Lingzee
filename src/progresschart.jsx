import React from 'react';

const ProgressChart = ({ xp }) => {
  // Calculate progress percentage (capped at 100%)
  const progressPercentage = Math.min((xp % 100) / 100 * 100, 100);
  const level = Math.floor(xp / 100) + 1;
  
  return (
    <div style={{
      margin: '20px 0',
      padding: '20px',
      backgroundColor: '#fff',
      borderRadius: '10px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#333' }}>Level {level}</h3>
        <span style={{ 
          fontWeight: 'bold', 
          color: '#4CAF50',
          fontSize: '0.9rem'
        }}>
          {xp} XP
        </span>
      </div>
      
      <div style={{
        height: '12px',
        backgroundColor: '#f0f0f0',
        borderRadius: '6px',
        overflow: 'hidden',
        marginBottom: '8px'
      }}>
        <div style={{
          height: '100%',
          width: `${progressPercentage}%`,
          backgroundColor: '#4CAF50',
          borderRadius: '6px',
          transition: 'width 0.5s ease'
        }}></div>
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.8rem',
        color: '#666'
      }}>
        <span>{xp % 100}/100 XP</span>
        <span>{Math.round(progressPercentage)}%</span>
      </div>
      
      <div style={{
        marginTop: '15px',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-block',
          padding: '5px 10px',
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
          borderRadius: '15px',
          fontSize: '0.8rem',
          fontWeight: 'bold'
        }}>
          {100 - (xp % 100)} XP to next level
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;