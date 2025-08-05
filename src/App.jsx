import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth.jsx';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Login from './pages/Login';
import About from './pages/About';
import CreateUser from './pages/CreateUser';
import VerifyAccount from './pages/VerifyAccount';
import Calendar from './pages/Calendar';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="layout">
          <TopBar />
          <div className="main">
            <Sidebar />
            <div className="content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/about" element={<About />} />
                <Route path="/create-user" element={<CreateUser />} />
                <Route path="/verify-account" element={<VerifyAccount />} />
                <Route path="/calendar" element={<Calendar />} />
              </Routes>
            </div>
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
