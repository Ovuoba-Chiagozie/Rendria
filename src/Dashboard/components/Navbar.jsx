import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { FaCrown } from "react-icons/fa";

// Define plan → credit mapping
const PLAN_CREDITS = {
  free: 30,
  starter: 1000,
  premium: 5000,
  enterprise: 20000,
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // 👇 pick credits based on plan
  const totalCredits = PLAN_CREDITS[user?.subscriptionPlan] || 0;
  const remainingCredits = user?.credits || 0;
  const usedCredits = Math.max(totalCredits - remainingCredits, 0);

  // Avoid NaN division when plan not found
  const percentage =
    totalCredits > 0
      ? Math.round((usedCredits / totalCredits) * 100)
      : 0;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-10 h-16 flex items-center justify-between px-6 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-4">
        {/* Credits Meter */}
        <Box sx={{ width: 200 }}>
          <Typography
            variant="caption"
            component="div"
            color="text.secondary"
            sx={{ mb: 0.5 }}
          >
            Credits Used: {usedCredits}/{totalCredits} ({percentage}%)
          </Typography>
          <LinearProgress
            variant="determinate"
            value={percentage}
            sx={{
              height: 8,
              borderRadius: 5,
              "& .MuiLinearProgress-bar": {
                backgroundColor: "#FF6E61FF",
              },
            }}
          />
        </Box>

        {/* Upgrade button */}
        <button
          onClick={() => navigate("/pricing")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-yellow-900 bg-yellow-200 hover:bg-yellow-300 transition-colors"
        >
          <FaCrown className="text-yellow-700" />
          Upgrade
        </button>
      </div>

      {/* Right side: User info + Logout */}
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-gray-700">{user.email || "User"}</span>
        )}
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 text-sm font-medium text-white bg-[#FF6E61FF] rounded-md hover:bg-[#e65f53] transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
