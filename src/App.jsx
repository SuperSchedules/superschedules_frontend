import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './auth.jsx';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import AppRoutes from './router';

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
              <AppRoutes />
            </div>
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
