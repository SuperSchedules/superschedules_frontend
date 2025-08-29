import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider } from './auth';
import { ThemeProvider } from './contexts/ThemeContext';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Login from './pages/Login';
import About from './pages/About';
import CreateUser from './pages/CreateUser';
import VerifyAccount from './pages/VerifyAccount';
import Calendar from './pages/Calendar';
import ResetPassword from './pages/ResetPassword';
import './App.css';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <div className="layout">
            <TopBar onToggleSidebar={() => setSidebarOpen((o) => !o)} />
            <div className="main">
              {sidebarOpen && <Sidebar />}
              <div className="content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/create-user" element={<CreateUser />} />
                  <Route path="/verify-account" element={<VerifyAccount />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/calendar" element={<Calendar />} />
                </Routes>
              </div>
            </div>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
