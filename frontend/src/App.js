import { Routes, Route } from "react-router-dom";
import "./App.css";
import Footer from "./components/Footer";
import NavBar from "./components/NavBar";
import CreateBotPage from "./pages/CreateBotPage";
import AuthModal from "./components/AuthModal";
import Dashboard from "./pages/Dashboard";
import EmbedPage from "./pages/EmbedPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import BotsPage from "./pages/BotsPage";
import BotDetailPage from "./pages/BotDetailPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatPage from "./pages/ChatPage";
import EmbedChatPage from "./pages/EmbedChatPage";
import FAQ from "./components/FAQ";
import Contact from "./components/Contact"; // Import Contact component
import { useLocation } from "react-router-dom";

function App() {
  const location = useLocation();
  const isEmbedPage = location.pathname.startsWith("/embed-chat");

  return (
    <>
      {!isEmbedPage && <NavBar />}
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/embed-chat/:botId" element={<EmbedChatPage />} />
        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-bot"
          element={
            <ProtectedRoute>
              <CreateBotPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bots"
          element={
            <ProtectedRoute>
              <BotsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bot/:id"
          element={
            <ProtectedRoute>
              <BotDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/embed/:botId"
          element={
            <ProtectedRoute>
              <EmbedPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bot/:id/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />{" "}
        {/* Add Contact route */}
      </Routes>
      <AuthModal />
      {/* <Footer /> */}
    </>
  );
}

export default App;
