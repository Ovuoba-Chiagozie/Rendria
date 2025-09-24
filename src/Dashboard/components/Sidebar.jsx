import { NavLink } from "react-router-dom";
import { LuLayoutTemplate } from "react-icons/lu";
import { AiOutlineApi } from "react-icons/ai";
import { IoImageOutline } from "react-icons/io5";
import { PiTerminalWindow } from "react-icons/pi";


export default function Sidebar() {
  const navItems = [
    { name: "My Templates", to: "/dashboard/templates", icon: LuLayoutTemplate },
    { name: "API", to: "/dashboard/api", icon: AiOutlineApi },
    { name: "Renders", to: "/dashboard/renders", icon:  IoImageOutline  },
    { name: "Playground", to: "/dashboard/playground", icon: PiTerminalWindow },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-gray-200 bg-white flex flex-col">
      {/* Logo / Branding */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <span className="text-lg font-semibold text-gray-800">MyApp</span>
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
