import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Login from '../pages/Login';
import About from '../pages/About';
import CreateUser from '../pages/CreateUser';
import VerifyAccount from '../pages/VerifyAccount';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/about" element={<About />} />
      <Route path="/create-user" element={<CreateUser />} />
      <Route path="/verify-account" element={<VerifyAccount />} />
    </Routes>
  );
}
