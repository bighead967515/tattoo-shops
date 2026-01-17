import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Home from "@/pages/Home";
import Directory from "@/pages/Directory";
import ShopDetail from "@/pages/ShopDetail";
import ArtistLogin from "@/pages/ArtistLogin";
import ArtistRegister from "@/pages/ArtistRegister";
import ArtistDashboard from "@/pages/ArtistDashboard";
import Favorites from "@/pages/Favorites";

function App() {
  return (
    <div className="App">
      <div className="noise-overlay" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/directory" element={<Directory />} />
          <Route path="/shop/:id" element={<ShopDetail />} />
          <Route path="/artist/login" element={<ArtistLogin />} />
          <Route path="/artist/dashboard" element={<ArtistDashboard />} />
          <Route path="/favorites" element={<Favorites />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" theme="dark" />
    </div>
  );
}

export default App;
