import Sidebar from "@/Dashboard/components/Sidebar";
import Navbar from "@/Dashboard/components/Navbar"; // 👈 import Navbar
import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col min-h-screen bg-gray-50">
        <Navbar /> {/* 👈 Add Navbar here */}
        <main className="flex-1 p-6">
          <Outlet /> {/* Nested routes */}
        </main>
      </div>
    </div>
  );
}
