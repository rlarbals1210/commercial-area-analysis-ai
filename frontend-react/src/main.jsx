import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import LandingPage from './pages/LandingPage.jsx'
import MapPage from './pages/MapPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import TrendPage from './pages/TrendPage.jsx'
import SocialCallbackPage from './pages/SocialCallbackPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import CommunityPage from './pages/CommunityPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/trend" element={<TrendPage />} />
        <Route path="/social-callback" element={<SocialCallbackPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/community" element={<CommunityPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
