// src/components/PropertiesPanel.jsx
import TextPropertiesPanel from "@/components/panels/TextPropertiesPanel";
import ImagePropertiesPanel from "@/components/panels/ImagePropertiesPanel";
import ShapesPropertiesPanel from "@/components/panels/ShapesPropertiesPanel";
import QRCodePropertiesPanel from "@/components/panels/QRCodePropertiesPanel";
import BarcodePropertiesPanel from "@/components/panels/BarcodePropertiesPanel";
import StarRatingPropertiesPanel from "@/components/panels/StarRatingPropertiesPanel";
import EmptySelectionPanel from "@/components/panels/EmptySelectionPanel";

import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { motion, AnimatePresence } from "motion/react";


export default function PropertiesPanel({
  fonts,
  elements,
  setElements,
  selectedId,
  updateSelectedElement,
  updateElements,
  isPropertiesPanelOpen,
  setIsPropertiesPanelOpen,
  templateId
}) {
  const selectedElement = elements.find((el) => el.id === selectedId);

  return (
    <div className="absolute w-fit h-full top-0 right-0">
      <AnimatePresence mode="wait">
        {isPropertiesPanelOpen && (
          <motion.div
            animate={{ width: "w-[18vw]", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.1, ease: "easeInOut" }}
            className="w-[18vw] overflow-y-auto max-w-64 min-w-[180px] h-full bg-white border-l-[#EBEBEAFF] border-l"
          > 
          <div className="p-4 font-bold capitalize border-b">Element Properties</div>
            {!selectedElement && isPropertiesPanelOpen ? (
              <EmptySelectionPanel /> // <-- show empty state
            ) : (
              <>
                {selectedElement?.type === "text" && (
                  <TextPropertiesPanel
                    fonts={fonts}
                    elements={elements}
                    setElements={setElements}
                    selectedId={selectedId}
                    updateSelectedElement={updateSelectedElement}
                    updateElements={updateElements}
                  />
                )}

                {selectedElement?.type === "image" && (
                  <ImagePropertiesPanel
                    elements={elements}
                    setElements={setElements}
                    selectedId={selectedId}
                    updateSelectedElement={updateSelectedElement}
                    updateElements={updateElements}
                    templateId={templateId}
                  />
                )}

                {selectedElement?.type === "shape" && (
                  <ShapesPropertiesPanel
                    updateSelectedElement={updateSelectedElement}
                    selectedId={selectedId}
                    elements={elements}
                    updateElements={updateElements}
                  />
                )}

                {selectedElement?.type === "qr-code" && (
                  <QRCodePropertiesPanel
                    updateSelectedElement={updateSelectedElement}
                    selectedId={selectedId}
                    elements={elements}
                    updateElements={updateElements}
                  />
                )}

                {selectedElement?.type === "barcode" && (
                  <BarcodePropertiesPanel
                    updateSelectedElement={updateSelectedElement}
                    selectedId={selectedId}
                    elements={elements}
                    updateElements={updateElements}
                  />
                )}

                {selectedElement?.type === "star-rating" && (
                  <StarRatingPropertiesPanel
                    updateSelectedElement={updateSelectedElement}
                    selectedId={selectedId}
                    elements={elements}
                    updateElements={updateElements}
                  />
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close button */}
      <div
        className={`p-1 absolute top-1/2 left-0
          translate-y-[-50%] ${
            isPropertiesPanelOpen ? "translate-x-[-50%]" : "translate-x-[-100%]"
          }
          w-8 h-10 rounded-[25%] shadow-md
          bg-white border border-gray-300
        `}
      >
        <button
          onClick={() => setIsPropertiesPanelOpen((prev) => !prev)}
          className="
            w-full h-full flex items-center justify-center rounded-[25%] 
            hover:bg-[#FF6E61FF] hover:text-white
          "
        >
          {isPropertiesPanelOpen ? (
            <MdKeyboardArrowRight size={18} />
          ) : (
            <MdKeyboardArrowLeft size={18} />
          )}
        </button>
      </div>
    </div>
  );
}
