// src/components/CreatedTemplatesSection.jsx
import { useNavigate } from "react-router-dom";
import { FaRegCopy } from "react-icons/fa";
import { useAlert } from "@/context/AlertContext";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAutomationModal } from "@/context/AutomationModalContext";
import axios from "axios";
import { APP_BASE_URL } from "@/utils/env";

export default function CreatedTemplatesSection({
  templates = [],
  fetchTemplates,
}) {
  return (
    <div className="p-6">
      <h2 className="text-3xl font-semibold mb-4">Created Templates</h2>

      {templates.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No templates created yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {templates.map((template) => (
            <TemplateCard
              key={template._id}
              template={template}
              fetchTemplates={fetchTemplates}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template, fetchTemplates }) {
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const { openModal } = useAutomationModal();

  const handleAutomate = (templateId) => {
    openModal(templateId);
  };

  const handleOpen = () => {
    // If this is a premade template, prefer duplicating first so user edits their own copy.
    if (template.premade) {
      // duplicate then navigate to new editor
      handleDuplicate(true);
    } else {
      navigate(`/editor/${template._id}`);
    }
  };

  // duplicateAndOpen flag: if true, after duplication we navigate to the new template
  const handleDuplicate = async (duplicateAndOpen = false) => {
    try {
      showAlert(`Duplicating ${template.name} template...`, {
        loading: true,
        persist: true,
      });

      // Build safe copy payload: copy elements but remove publicId fields
      const safeElements = (template.elements || []).map((el) => {
        const copy = { ...el };
        // remove publicId to avoid linking to premade Cloudinary ids
        if ("publicId" in copy) delete copy.publicId;
        // also remove template-specific top-level fields if any exist
        return copy;
      });

      const payload = {
        name: `Copy of ${template.name}`,
        elements: safeElements,
        canvasSize: template.canvasSize,
        thumbnailUrl: template.thumbnailUrl || "",
        // do not include template.publicId or isPremade/premade
      };

      // create template (backend will attach userId and strip premade if sent)
      const createRes = await axios.post(`${APP_BASE_URL}/app/templates`, payload, {
        withCredentials: true,
      });

      const newTemplate = createRes.data;

      showAlert("Template duplicated successfully!", { type: "success" });

      // refresh list
      fetchTemplates?.();

      if (duplicateAndOpen && newTemplate && newTemplate._id) {
        navigate(`/editor/${newTemplate._id}`);
      }
    } catch (err) {
      console.error("Duplicate failed:", err);
      showAlert("Failed to duplicate template", { type: "error" });
    }
  };

  const handleDelete = async () => {
    try {
      showAlert(`Deleting ${template.name}...`, {
        loading: true,
        persist: true,
      });

      await axios.delete(`${APP_BASE_URL}/app/templates/${template._id}`, {
        withCredentials: true,
      });

      showAlert("Template deleted successfully!", { type: "success" });
      fetchTemplates();
    } catch (err) {
      console.error("Delete failed:", err);
      // If deletion was blocked server-side because it's premade, show friendly message
      if (err?.response?.status === 403) {
        showAlert("This premade template cannot be deleted", { type: "error" });
      } else {
        showAlert("Failed to delete template", { type: "error" });
      }
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(template._id);
      showAlert("Copied template ID", "success");
    } catch (err) {
      showAlert("Failed to copy ID", "error");
    }
  };

  return (
    <Card
      className="flex flex-col overflow-hidden cursor-pointer hover:shadow-md shadow-none transition p-3 bg-white border border-gray-200"
      onClick={handleOpen}
    >
      {/* Thumbnail */}
      <CardContent className="relative flex-1 flex items-center justify-center bg-gray-50 p-2">
        {template.thumbnailUrl ? (
          <img src={template.thumbnailUrl} alt={template.name} className="object-contain max-h-28 w-auto" />
        ) : (
          <div className="text-xs text-gray-400">No thumbnail</div>
        )}
      </CardContent>

      {/* Title + Info */}
      <CardHeader className="p-0 py-2">
        <CardTitle className="text-sm font-medium truncate">{template.name}{template.premade ? " • Premade" : ""}</CardTitle>
        <div className="text-xs text-gray-600">
          {template.canvasSize?.width} x {template.canvasSize?.height}px
        </div>
      </CardHeader>
      <Separator />

      {/* Footer: Actions */}
      <CardFooter className="p-0 pt-2 flex " onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          {/* Automate Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs flex items-center gap-1 bg-black text-white"
                  onClick={() => handleAutomate(template._id)}
                >
                  Automate
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Set up Google Sheets automation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Copy ID */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleCopyId} className="h-8 w-8">
                  <FaRegCopy className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy ID {template._id}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* More Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                <span className="sr-only">More actions</span>⋮
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {/* Open/Edit: for premade this will duplicate then open */}
              <DropdownMenuItem onClick={handleOpen}>Open / Use</DropdownMenuItem>

              <DropdownMenuItem onClick={handleCopyId}>Copy Template ID</DropdownMenuItem>

              <DropdownMenuItem onClick={() => handleDuplicate(false)}>Duplicate</DropdownMenuItem>

              <Separator />

              {/* only allow delete if NOT premade */}
              {!template.premade ? (
                <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                  Delete
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">
                  Delete (locked)
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardFooter>
    </Card>
  );
}
