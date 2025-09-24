import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LuX } from "react-icons/lu";

export default function TemplateGallery({
  setIsTemplateGalleryOpen,
  onCreateTemplate,
  templates = [],
  fetchTemplates,
  onSelectTemplate,
}) {
  // Fetch templates when gallery mounts
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return (
    <AnimatePresence>
      {/* Overlay with blur */}
      <motion.div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Modal Content */}
        <motion.div
          className="bg-white rounded-2xl shadow-xl w-[90%] max-w-5xl h-[80%] relative p-6 flex flex-col"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsTemplateGalleryOpen(false)}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <LuX size={24} />
          </button>

          {/* Create New Template Button */}
          <div className="mb-6">
            <button
              onClick={onCreateTemplate}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              + Create New Template
            </button>
          </div>

          {/* Template Gallery (Flex Masonry) */}
          <div className="flex-1 overflow-y-auto border-2 bg-slate-100 p-4 rounded-lg">
            {templates.length === 0 ? (
              <p className="text-center text-gray-500">No templates found.</p>
            ) : (
              <div className="flex flex-wrap gap-4">
                {templates.map((tpl) => (
                  <div
                    key={tpl._id}
                    className="flex-1 basis-[calc(25%-1rem)] max-w-[calc(25%-1rem)] cursor-pointer hover:opacity-90 transition"
                    onClick={() => onSelectTemplate(tpl)}
                  >
                    <img
                      src={tpl.thumbnailUrl}
                      alt={tpl.name}
                      className="w-full rounded-lg border-2 border-gray-200 hover:border-blue-500"
                    />
                    <div className="mt-2 text-center">
                      <p className="font-medium text-gray-700 transition">
                        {tpl.name}
                      </p>
                      {tpl.canvasSize && (
                        <p className="text-sm text-gray-500 transition">
                          {tpl.canvasSize.width} × {tpl.canvasSize.height}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
