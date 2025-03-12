import { Routes, Route } from "react-router-dom";
import "./App.css";
import Footer from "./components/Footer";
import NavBar from "./components/NavBar";
import UploadPage from "./pages/UploadPage";
import AuthModal from "./components/AuthModal";
// import Dashboard from "./pages/Dashboard"; // Add the Dashboard Page
// import Home from "./pages/Home"; // Optional: A Home Page

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        {/* <Route path="/" element={<Home />} /> */}
        <Route path="/upload" element={<UploadPage />} />
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
      </Routes>
      <AuthModal />
      <Footer />
    </>
  );
}

export default App;
