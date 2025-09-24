import { MdKeyboardArrowLeft } from "react-icons/md";
import { motion } from "motion/react";

import ShapesPanel from "@/components/sidebar/panels/ShapesPanel";
import QRCodePanel from "@/components/sidebar/panels/QrCodePanel";
import BarcodePanel from "@/components/sidebar/panels/BarCodePanel";
import StarRatingPanel from "@/components/sidebar/panels/StarRatingPanel";

const WideSidebar = ({
  type,
  onClose,
  setElements,
  setSelectedId,
  counters,
  setCounters,
}) => {
  return (
    <div className="relative">
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 240, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="w-[240px] h-full bg-white overflow-y-auto border-r border-[#EBEBEAFF]"
      >
        <div className="p-4 font-bold capitalize border-b">{type}</div>
        {type === "shapes" && (
          <ShapesPanel
            setElements={setElements}
            setSelectedId={setSelectedId}
            counters={counters}
            setCounters={setCounters}
          />
        )}
        {type === "qr-code" && (
          <QRCodePanel
            setElements={setElements}
            setSelectedId={setSelectedId}
            counters={counters}
            setCounters={setCounters}
          />
        )}
        {type === "barcode" && (
          <BarcodePanel
            setElements={setElements}
            setSelectedId={setSelectedId}
            counters={counters}
            setCounters={setCounters}
          />
        )}
        {type === "star-rating" && (
          <StarRatingPanel
            setElements={setElements}
            setSelectedId={setSelectedId}
            counters={counters}
            setCounters={setCounters}
          />
        )}

        {/* Close button */}
        <div
          className="p-1 absolute top-1/2 right-0
          translate-y-[-50%] translate-x-[50%]
          w-8 h-10 rounded-[25%] shadow-md
          bg-white border border-gray-300
          
         "
        >
          <button
            onClick={onClose}
            className="
          w-full h-full flex items-center justify-center rounded-[25%] 
          hover:bg-[#FF6E61FF] hover:text-white
        "
          >
            <MdKeyboardArrowLeft size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default WideSidebar;
