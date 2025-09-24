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
import axios from "axios";

export default function CreatedTemplatesSection({
  templates = [],
  fetchTemplates,
}) {
  return (
    <div className="p-6">
      <h2 className="text-3xl font-semibold mb-4">Created Templates</h2>

      {templates.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          No templates created yet.
        </div>
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

  const handleOpen = () => {
    navigate(`/editor/${template._id}`);
  };

  const handleDuplicate = async () => {
    try {
      showAlert(`Duplicating ${template.name} template...`, {
        loading: true,
        persist: true,
      });

      await axios.post(
        "http://localhost:5000/app/templates",
        {
          name: `Copy of ${template.name}`,
          isPremade: template.isPremade,
          elements: template.elements,
          canvasSize: template.canvasSize,
          publicId: template.publicId,
          thumbnailUrl: template.thumbnailUrl,
        },
        { withCredentials: true }
      );

      showAlert("Template duplicated successfully!", { type: "success" });
      fetchTemplates();
    } catch (err) {
      showAlert("Failed to duplicate template", { type: "error" });
    }
  };

  const handleDelete = async () => {
    try {
      showAlert(`Deleting ${template.name}...`, {
        loading: true,
        persist: true,
      });

      await axios.delete(
        `http://localhost:5000/app/templates/${template._id}`,
        { withCredentials: true }
      );

      showAlert("Template deleted successfully!", { type: "success" });
      fetchTemplates();
    } catch (err) {
      showAlert("Failed to delete template", { type: "error" });
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
        <img
          src={template.thumbnailUrl}
          alt={template.name}
          className="object-contain max-h-28 w-auto"
        />
      </CardContent>

      {/* Title + Info */}
      <CardHeader className="p-0 py-2">
        <CardTitle className="text-sm font-medium truncate">
          {template.name}
        </CardTitle>
        <div className="text-xs text-gray-600">
          {template.canvasSize.width} x {template.canvasSize.height}px
        </div>
      </CardHeader>
      <Separator />

      {/* Footer: Actions */}
      <CardFooter
        className="p-0 pt-2 flex justify-end"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          {/* Copy ID */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyId}
                  className="h-8 w-8"
                >
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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">More actions</span>⋮
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={handleOpen}>
                Open/Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyId}>
                Copy Template ID
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                Duplicate
              </DropdownMenuItem>
              <Separator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-600 focus:text-red-600"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardFooter>
    </Card>
  );
}
