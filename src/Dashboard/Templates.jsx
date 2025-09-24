import { useState, useEffect, useCallback } from "react";
import axios from "axios";

import CreateTemplate from "@/Dashboard/sections/CreateTemplate";
import CreatedTemplatesSection from "@/Dashboard/sections/CreatedTemplates";

import { useAlert } from "@/context/AlertContext";

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const { showAlert } = useAlert();

  // fetch templates from API
  const fetchTemplates = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/app/templates", {
        withCredentials: true,
      });
      setTemplates(res.data);
    } catch (err) {
      console.error("Error fetching templates:", err);
    }
  }, []);

  // load templates on mount
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // actions (stubbed for now)
  const handleOpenTemplate = (id) => {
    console.log("Open template", id);
  };
  const handleAutomateTemplate = (id) => {
    console.log("Automate template", id);
  };

  return (
    <div className="space-y-12">
      {/* Create Template Section */}
      <CreateTemplate />

      {/* Created Templates Section */}
      <CreatedTemplatesSection
        templates={templates}
        onOpenTemplate={handleOpenTemplate}
        onAutomateTemplate={handleAutomateTemplate}
        fetchTemplates={fetchTemplates}
      />
    </div>
  );
}
