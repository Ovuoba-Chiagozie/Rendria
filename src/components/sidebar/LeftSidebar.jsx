// @ts-nocheck
import { useRef, useState } from "react";
import NarrowSidebar from "@/components/sidebar/NarrowSidebar";
import WideSidebar from "@/components/sidebar/WideSidebar";
import { useClickOutside } from "@/utils/useClickOutside";
import { AnimatePresence } from "motion/react";
import ZoomControl from "@/components/ZoomComponent";


const LeftSidebar = ({
  setElements,
  setSelectedId,
  zoom,
  setZoom,
  setIsTemplateGalleryOpen,
  counters,
  setCounters
}) => {
  const [activePanel, setActivePanel] = useState(null);
  const leftSidebarRef = useRef(null);

  useClickOutside(leftSidebarRef, () => setActivePanel(null));

  return (
    <div
      ref={leftSidebarRef}
      className="flex h-full z-20 absolute left-0 top-0"
    >
      {/* Narrow menu */}
      <NarrowSidebar
        setElements={setElements}
        setActivePanel={setActivePanel}
        setSelectedId={setSelectedId}
        setIsTemplateGalleryOpen={setIsTemplateGalleryOpen}
        counters={counters}
        setCounters={setCounters}
      />

      {/* Conditionally show wide panel */}
      <AnimatePresence mode="wait">
        {activePanel && (
          <WideSidebar
            type={activePanel}
            onClose={() => setActivePanel(null)}
            setElements={setElements}
            setSelectedId={setSelectedId}
            counters={counters}
            setCounters={setCounters}
          />
        )}
      </AnimatePresence>

      <ZoomControl zoom={zoom} setZoom={setZoom} />
    </div>
  );
};

export default LeftSidebar;
