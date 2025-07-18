import React, { createContext, useContext, useState } from 'react';

const AssistantContext = createContext();

export const AssistantProvider = ({ children }) => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);

  const toggleAssistant = () => {
    setIsAssistantOpen(prev => !prev);
    if (!isAssistantOpen) {
      setMinimized(false);
    }
  };

  const toggleMinimized = () => {
    setMinimized(prev => !prev);
  };

  return (
    <AssistantContext.Provider
      value={{
        isAssistantOpen,
        toggleAssistant,
        minimized,
        toggleMinimized,
        currentCourse,
        setCurrentCourse
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
};

export const useAssistant = () => {
  return useContext(AssistantContext);
};