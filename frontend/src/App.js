import { Routes, Route } from "react-router-dom";
import "./App.css";
import Footer from "./components/Footer";
import NavBar from "./components/NavBar";
import CreateBotPage from "./pages/CreateBotPage";
import AuthModal from "./components/AuthModal";
import Dashboard from "./pages/Dashboard";
import EmbedPage from "./pages/EmbedPage";
import LoginPage from "./pages/LoginPage";
import BotsPage from "./pages/BotsPage";
import BotDetailPage from "./pages/BotDetailPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatPage from "./pages/ChatPage";

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

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
      </Routes>
      <AuthModal />
      <Footer />
    </>
  );
}

export default App;
