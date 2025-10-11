import React, { createContext, useContext, useState } from "react";
import AutomationModal from "@/components/AutomationModal";

const AutomationModalContext = createContext();

export const useAutomationModal = () => {
  const context = useContext(AutomationModalContext);
  if (!context) {
    throw new Error("useAutomationModal must be used within AutomationModalProvider");
  }
  return context;
};

export const AutomationModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [templateId, setTemplateId] = useState(null);

  const openModal = (id) => {
    setTemplateId(id);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTemplateId(null);
  };

  return (
    <AutomationModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {isOpen && templateId && (
        <AutomationModal templateId={templateId} onClose={closeModal} />
      )}
    </AutomationModalContext.Provider>
  );
};