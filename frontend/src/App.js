import { Routes, Route } from "react-router-dom";
import "./App.css";
import Footer from "./components/Footer";
import NavBar from "./components/NavBar";
import CreateBotPage from "./pages/CreateBotPage";
import AuthModal from "./components/AuthModal";
import Dashboard from "./pages/Dashboard"; // Add the Dashboard Page
import EmbedPage from "./pages/EmbedPage"; // Add the Embed Page
import LoginPage from "./pages/LoginPage";
import BotsPage from "./pages/BotsPage";
import BotDetailPage from "./pages/BotDetailPage";
// import Home from "./pages/Home"; // Optional: A Home Page

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        {/* <Route path="/" element={<Home />} /> */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/create-bot" element={<CreateBotPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/embed/:botId" element={<EmbedPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/bots" element={<BotsPage />} />
        <Route path="/bot/:id" element={<BotDetailPage />} />
      </Routes>
      <AuthModal />
      <Footer />
    </>
  );
}

export default App;
