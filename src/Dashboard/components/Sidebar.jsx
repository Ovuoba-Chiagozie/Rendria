import { NavLink } from "react-router-dom";
import { LuLayoutTemplate, LuFileSpreadsheet } from "react-icons/lu";
import { AiOutlineApi } from "react-icons/ai";
import { IoImageOutline } from "react-icons/io5";
import { PiTerminalWindow } from "react-icons/pi";
import { MdOutlineBatchPrediction } from "react-icons/md";


export default function Sidebar() {
  const navItems = [
    { name: "My Templates", to: "/templates", icon: LuLayoutTemplate },
    { name: "Bulk CSV", to: "/bulk-generation", icon: LuFileSpreadsheet },
    { name: "Batches", to: "/batches", icon: MdOutlineBatchPrediction },
    { name: "API", to: "/api", icon: AiOutlineApi },
    { name: "Renders", to: "/renders", icon: IoImageOutline },
    { name: "Playground", to: "/playground", icon: PiTerminalWindow },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-gray-200 bg-white flex flex-col">
      {/* Logo / Branding */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <a href="/" className="flex items-center">
          <img
            src="/logo.svg"
            alt="Logo"
            className="w-11 h-11 object-contain"
          />
          {/* Wordmark */}
          <span
            className="text-2xl ml-3 font-semibold" // was text-2xl
            style={{ fontFamily: "Sora, sans-serif" }}
          >
            <span className="text-[#0F172A]">Ren</span>
            <span className="text-[#FF6E61]">dria</span>
          </span>
        </a>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                 ${
                   isActive
                     ? "bg-[#FF6E61FF] text-white"
                     : "text-gray-700 hover:bg-[#FF6E61FF] hover:text-white"
                 }`
              }
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
