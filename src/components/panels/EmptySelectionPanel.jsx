// src/components/EmptySelectionPanel.jsx
import React from "react";
import SelectionIcon from "@/assets/empty-selection.svg";

const EmptySelectionPanel = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
       <img
        src={SelectionIcon}
        alt="No selection"
        className="w-32 h-32 opacity-70"
      />
      <h2 className="mt-4 text-lg font-semibold text-gray-500">
        No element selected
      </h2>
      <p className="mt-1 text-sm text-gray-400 max-w-sm">
        Select an element on the canvas to edit its properties.
      </p>
    </div>
  );
};

export default EmptySelectionPanel;
