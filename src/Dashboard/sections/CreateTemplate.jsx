import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // ✅ use axios
import { FaInstagram, FaYoutube, FaFacebook, FaXTwitter } from "react-icons/fa6";
import { MdOutlineBusinessCenter, MdOutlineCampaign } from "react-icons/md";
import { LuFileText, LuPrinter, LuRuler } from "react-icons/lu";

import CategoryModal from "@/Dashboard/components/CategoryModal";

const categories = [
  {
    name: "Social Media",
    color: "from-blue-500 to-purple-500",
    icon: (
      <div className="flex gap-2 text-3xl">
        <FaInstagram />
        <FaYoutube />
        <FaFacebook />
        <FaXTwitter />
      </div>
    ),
    presets: [
      { name: "Instagram Post", width: 1080, height: 1080, unit: "px" },
      { name: "YouTube Thumbnail", width: 1280, height: 720, unit: "px" },
      { name: "LinkedIn Banner", width: 1584, height: 396, unit: "px" },
    ],
    modalPresets: [
      { name: "Story (Facebook / Instagram)", width: 1080, height: 1920 },
      { name: "Square Post (Facebook / Instagram)", width: 1080, height: 1080 },
      { name: "Landscape Post (Facebook / Instagram)", width: 1200, height: 630 },
      { name: "Portrait Post (Facebook / Instagram)", width: 1080, height: 1350 },
      { name: "Banner (Twitter)", width: 1500, height: 500 },
      { name: "Post Image (Twitter)", width: 1600, height: 900 },
      { name: "Post (LinkedIn)", width: 1200, height: 628 },
      { name: "Banner (LinkedIn)", width: 1584, height: 396 },
      { name: "Thumbnail (YouTube)", width: 1280, height: 720 },
    ],
  },
  {
    name: "Business & Marketing",
    color: "from-cyan-600 to-blue-700",
    icon: (
      <div className="flex gap-2 text-3xl">
        <MdOutlineBusinessCenter />
        <MdOutlineCampaign />
      </div>
    ),
    presets: [
      { name: "Business Card", width: 1050, height: 600, unit: "px" },
      { name: "Flyer", width: 2550, height: 3300, unit: "px" },
      { name: "Pitch Deck", width: 1920, height: 1080, unit: "px" },
    ],
    modalPresets: [
      { name: "Open Graph Default", width: 1200, height: 630 },
      { name: "Open Graph Square", width: 1200, height: 1200 },
      { name: "Rectangle Banner", width: 900, height: 750 },
      { name: "Billboard Banner", width: 970, height: 250 },
    ],
  },
  {
    name: "Print Documents",
    color: "from-gray-400 to-gray-600",
    icon: (
      <div className="flex gap-2 text-3xl">
        <LuFileText />
        <LuPrinter />
      </div>
    ),
    presets: [
      { name: "A4", width: 2480, height: 3508, unit: "px" },
      { name: "Letter", width: 2550, height: 3300, unit: "px" },
      { name: "Legal", width: 2550, height: 4200, unit: "px" },
    ],
    modalPresets: [
      { name: "A4", width: 2480, height: 3508, dpi: 300 },
      { name: "US Letter", width: 2550, height: 3300, dpi: 300 },
      { name: "US Legal", width: 2550, height: 4200, dpi: 300 },
    ],
  },
  {
    name: "Custom Size",
    color: "from-green-500 to-emerald-700",
    icon: <LuRuler className="text-3xl" />,
    presets: [],
  },
];

export default function CreateTemplate() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const navigate = useNavigate();

   // ✅ API call to create a template with axios
   const createTemplate = async (data) => {
    try {
      const res = await axios.post(
        "http://localhost:5000/app/templates",
        data,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,   // 👈 ensures cookies are sent
        }
      );

      const newTemplate = res.data;
      navigate(`/editor/${newTemplate._id}`); // adjust if your backend returns `id`
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section className="w-full max-w-6xl mx-auto py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-2">Create a New Template</h2>
        <p className="text-gray-600">
          Choose a category to start with recommended sizes and presets.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 bg-white p-8 rounded-2xl border border-gray-200 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.05, y: -4 }}
            className={`rounded-2xl p-6 text-white shadow-lg cursor-pointer bg-gradient-to-br ${cat.color} flex flex-col justify-between`}
            onClick={() => setSelectedCategory(cat)}
          >
            <div className="mb-4">{cat.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{cat.name}</h3>
            <ul className="text-sm opacity-90 space-y-1">
              {cat.presets.length > 0 ? (
                cat.presets.map((p, i) => <li key={i}>• {p.name}</li>)
              ) : (
                <li>• Set Width & Height</li>
              )}
            </ul>
          </motion.div>
        ))}
      </div>

      {/* Category Modal */}
      <CategoryModal
        isOpen={!!selectedCategory}
        onClose={() => setSelectedCategory(null)}
        category={selectedCategory}
        presets={selectedCategory?.modalPresets || []}
        onSelectPreset={(preset) => {
          createTemplate({
            name: "Untitled Template",
            elements: [],
            canvasSize: {
              width:preset.width,
              height:preset.height
            }
          });
        }}
        onCreateCustom={(custom) => {
          createTemplate({
            name: "Untitled Template",
            elements: [],
            canvasSize: {
              width:custom.width,
              height:custom.height
            }
          });
        }}
      />
    </section>
  );
}
