import { useRef } from "react";
import { FaChevronDown } from "react-icons/fa6";
import { useClickOutside } from "@/utils/useClickOutside";

// Main Dropdown container
const Dropdown = ({ children, isOpen, onOpenChange }) => {
  const dropdownRef = useRef(null);
  useClickOutside(dropdownRef, () => {
    onOpenChange(false);
  });
  return <div ref={dropdownRef}>{children}</div>;
};

// Toggle Button
const Button = ({ children, label, isOpen, onOpenChange, fontFamily }) => {
  const handleClick = () => onOpenChange(!isOpen);

  return (
    <button
      className="px-3 rounded-md text-sm w-full py-2 flex items-center justify-between border border-[#EBEBEAFF] hover:border-blue-400 cursor-pointer relative bg-white"
      onClick={handleClick}
      style={fontFamily ? { fontFamily } : undefined}
    >
      {label}
      <span className="block">
        <FaChevronDown />
      </span>
      {isOpen && children}
    </button>
  );
};

// Dropdown menu wrapper
const Menu = ({ children }) => {
  return (
    <div className="absolute z-10 top-12 overflow-y-auto max-h-56 left-0 rounded bg-white border border-gray-200 w-full">
      <ul className="flex flex-col p-2">{children}</ul>
    </div>
  );
};

// Each menu item
const MenuItem = ({ onClick, children, fontFamily }) => (
  <li
    className="flex items-center gap-2 p-3 py-2 hover:bg-[#FF6E61FF] hover:text-white rounded transition-all duration-200 cursor-pointer"
    onClick={onClick}
    style={fontFamily ? { fontFamily } : undefined}
  >
    {children}
  </li>
);

// Attach subcomponents
Dropdown.Button = Button;
Dropdown.Menu = Menu;
Dropdown.MenuItem = MenuItem;

export default Dropdown;
