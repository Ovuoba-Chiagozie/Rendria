import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { FaDownload, FaTrashAlt } from "react-icons/fa";
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
import { useAlert } from "@/context/AlertContext";

export default function Renders() {
  const [renders, setRenders] = useState([]);
  const { showAlert } = useAlert();

  const fetchRenders = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/app/renders`, {
        withCredentials: true,
      });
      setRenders(res.data);
    } catch (err) {
      showAlert("Failed to load renders", { type: "error" });
    }
  };

  useEffect(() => {
    fetchRenders();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-3xl font-semibold mb-4">Your Renders</h2>

      {renders.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          No renders yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {renders.map((render) => (
            <RenderCard
              key={render._id}
              render={render}
              fetchRenders={fetchRenders}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RenderCard({ render, fetchRenders }) {
  const { showAlert } = useAlert();

  const handleDownload = async () => {
    try {
      const res = await axios.get(render.url, { responseType: "blob" });
      const blobUrl = URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${render.template_name}.${render.format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      showAlert("Failed to download render", { type: "error" });
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/app/renders/${render._id}`, {
        withCredentials: true,
      });
      showAlert("Render deleted", { type: "success" });
      fetchRenders();
    } catch (err) {
      showAlert("Failed to delete render", { type: "error" });
    }
  };

  const formatColors = {
    png: "bg-green-100 text-green-700",
    jpeg: "bg-blue-100 text-blue-700",
    jpg: "bg-blue-100 text-blue-700",
    webp: "bg-purple-100 text-purple-700",
  };

  return (
    <Card className="flex flex-col overflow-hidden hover:shadow-md transition p-3 bg-white border border-gray-200">
      <CardContent className="relative flex-1 flex items-center justify-center bg-gray-50 p-2">
        <span
          className={`absolute top-2 right-2 text-xs px-2 py-1 rounded ${formatColors[render.format] || "bg-gray-200 text-gray-700"}`}
        >
          {render.format.toUpperCase()}
        </span>
        <img
          src={render.url}
          alt={render.template_name}
          className="object-contain max-h-28 w-auto"
        />
      </CardContent>

      <CardHeader className="p-0 py-2">
        <CardTitle className="text-sm font-medium truncate">
          {render.template_name}
        </CardTitle>
        <div className="text-xs text-gray-600">
          {format(new Date(render.created_at), "PPpp")}
        </div>
      </CardHeader>
      <Separator />
      <CardFooter className="p-0 pt-2 flex justify-between">
        <Button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <FaDownload /> Download
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              ⋮
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={handleDownload}>
              Download
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-red-600 focus:text-red-600"
            >
              <FaTrashAlt className="mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
