import { Route, Routes, useNavigate } from "react-router-dom";
import Glitfinder from "@/pages/glitfinder";
import ViewAllGlits from "@/pages/glitfinder/ViewAllGlits";
import ViewGlit from "@/pages/glitfinder/ViewGlit";
import ViewGlitboard from "@/pages/glitfinder/ViewGlitboard";
import GlitProfilePage from "@/pages/glitfinder/GlitProfile";

function GlitProfileEditPlaceholder() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 flex items-center border-b border-[#E5E7EB] bg-white px-4 py-3">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <span className="text-[#101828]">← Back</span>
        </button>
      </header>
      <div className="p-6">
        <h1 className="text-[20px] font-semibold text-[#101828] font-[lora] mb-2">Edit profile</h1>
        <p className="text-[15px] text-[#6C6C6C]">Edit profile form coming soon.</p>
      </div>
    </div>
  );
}

const GlitfinderRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Glitfinder />} />
      <Route path="/all" element={<ViewAllGlits />} />
      <Route path="/glit/:glitId" element={<ViewGlit />} />
      <Route path="/board/:boardId" element={<ViewGlitboard />} />
      <Route path="/profile" element={<GlitProfilePage />} />
      <Route path="/profile/edit" element={<GlitProfileEditPlaceholder />} />
      <Route path="/profile/:username" element={<GlitProfilePage />} />
    </Routes>
  );
};

export default GlitfinderRoutes;