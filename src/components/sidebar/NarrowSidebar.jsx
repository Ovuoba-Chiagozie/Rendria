import { IoTextOutline } from "react-icons/io5";
import { CiImageOn, CiBarcode, CiStar } from "react-icons/ci";
import { PiShapes } from "react-icons/pi";
import { BsLayers, BsQrCode } from "react-icons/bs";
import { LuLayoutTemplate } from "react-icons/lu";
import { v4 as uuid } from "uuid";


const NarrowSidebar = ({
  setElements,
  setSelectedId,
  setActivePanel,
  setIsTemplateGalleryOpen,
  counters,
  setCounters
}) => {
  const items = [
    {
      id: "templates",
      label: "Templates",
      icon: <LuLayoutTemplate size={24} />,
    },
    { id: "text", label: "Text", icon: <IoTextOutline size={24} /> },
    { id: "image", label: "Image", icon: <CiImageOn size={24} /> },
    { id: "shapes", label: "Shapes", icon: <PiShapes size={24} /> },
    { id: "qr-code", label: "QR Code", icon: <BsQrCode size={24} /> },
    { id: "barcode", label: "Bar Code", icon: <CiBarcode size={24} /> },
    { id: "star-rating", label: "Star Rating", icon: <CiStar size={24} /> },
  ];

  const addText = () => {
    // 1. Get the next count (without mutating state yet)
    const nextCount = counters.text + 1;
  
    // 2. Build the element
    const newText = {
      id: uuid(),
      name: `text-${nextCount}`,
      type: "text",
      family: "Roboto",
      bold: false,
      italic: false,
      fontSize: 16,
      color: "#000000",
      content: "This is text",
      underline: false,
      lineThrough: false,
      uppercase: false,
      textAlignIndex: 0,
      letterSpacing: 1,
      lineSpacing: 1,
      width: 100,
      height: 100,
      x: 100,
      y: 100,
      rotation: 0,
    };
  
    // 3. Update elements & selectedId
    setElements((prev) => [...prev, newText]);
    setSelectedId(newText.id);
  
    // 4. Update counters (separately, last step)
    setCounters((prev) => ({ ...prev, text: nextCount }));
  };

  const addImage = () => {
    const nextCount = counters.image + 1;
  
    const newImage = {
      id: uuid(),
      name: `image-${nextCount}`,
      type: "image",
      src: null,
      x: 150,
      y: 150,
      width: 150,
      height: 150,
      rotation: 0,
      borderWidth: 0,
      borderColor: "#ffffff",
      borderRadius: { value: 0, unit: "px" },
      flipX: false,
      flipY: false,
      objectFit: "fill",
    };
  
    setElements((prev) => [...prev, newImage]);
    setSelectedId(newImage.id);
  
    setCounters((prev) => ({ ...prev, image: nextCount }));
  };
  

  const handleClick = (id) => {
    if (id === "text") addText();
    if (id === "image") addImage();
    if (id === "templates") setIsTemplateGalleryOpen(true);
    // For shapes, vectors, layers → open wide panel
    if (
      id === "shapes" ||
      id === "qr-code" ||
      id === "barcode" ||
      id === "star-rating"
    ) {
      setActivePanel(id);
      return;
    }
    // For templates, text, image → close wide panel
    if (id === "templates" || id === "text" || id === "image") {
      setActivePanel(null);
      return;
    }

    // You’ll plug in the rest later
  };

  return (
    <div className="w-20 h-full bg-white border-r border-[#EBEBEAFF] flex flex-col items-center py-4 gap-6">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => handleClick(item.id)}
          className="flex flex-col items-center gap-2 hover:text-[#FF6E61FF] focus:outline-none"
        >
          {item.icon}
          <span className="text-xs">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default NarrowSidebar;
