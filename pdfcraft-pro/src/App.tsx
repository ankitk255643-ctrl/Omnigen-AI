import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ToolPage from './pages/ToolPage';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import Auth from './pages/Auth';
import ApiDocs from './pages/ApiDocs';
import Legal from './pages/Legal';
import { User, FileRecord } from './types';
import { PDF_TOOLS } from './toolsData';

export default function App() {
  // Page Routing States
  // Can be: 'home', 'tools', 'pricing', 'api', 'login', 'signup', 'dashboard', 'privacy', 'terms', or any valid PDF_TOOLS id (e.g., 'merge-pdf')
  const [activePage, setActivePage] = useState<string>('home');
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);

  // User Authentication Context States
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Favorites collection state
  const [favorites, setFavorites] = useState<string[]>([]);

  // Page scrolling auxiliary trigger
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activePage, selectedToolId]);

  // Load user session and favorites on startup
  useEffect(() => {
    const cachedUser = localStorage.getItem('pdfcraft_user_session');
    if (cachedUser) {
      try {
        setCurrentUser(JSON.parse(cachedUser));
      } catch (e) {
        localStorage.removeItem('pdfcraft_user_session');
      }
    }

    const cachedFavs = localStorage.getItem('pdfcraft_favorites');
    if (cachedFavs) {
      try {
        setFavorites(JSON.parse(cachedFavs));
      } catch (e) {}
    }
  }, []);

  // Sync favorites persistence
  const handleToggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    let updated: string[];
    if (favorites.includes(id)) {
      updated = favorites.filter((favId) => favId !== id);
    } else {
      updated = [...favorites, id];
    }
    setFavorites(updated);
    localStorage.setItem('pdfcraft_favorites', JSON.stringify(updated));
  };

  // Auth Action Success Handlers
  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('pdfcraft_user_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pdfcraft_user_session');
    setActivePage('home');
    setSelectedToolId(null);
  };

  const handleUpgradeSuccess = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('pdfcraft_user_session', JSON.stringify(updatedUser));
  };

  // Quick launch helper from Landing page Hero dropping files
  const handleQuickUploadLaunch = (files: File[]) => {
    // Stage them inside our state and launch standard PDF Merge
    setActivePage('merge-pdf');
  };

  // Coordinate master custom page routers
  const renderActivePage = () => {
    // If activePage matches any toolId or path in PDF_TOOLS, render the dynamic ToolPage wrapper!
    const cleanId = activePage.replace(/^\//, '');
    const matchingTool = PDF_TOOLS.find((t) => t.id === cleanId || t.path === activePage || t.id === activePage);
    if (matchingTool) {
      return (
        <ToolPage 
          toolId={matchingTool.id} 
          onBack={() => setActivePage('home')}
          currentUser={currentUser}
          onNavigate={setActivePage}
        />
      );
    }

    switch (activePage) {
      case 'home':
      case 'tools':
        return (
          <Home 
            onSelectTool={setActivePage}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onQuickUpload={handleQuickUploadLaunch}
          />
        );
      case 'dashboard':
        if (!currentUser) {
          return (
            <Auth 
              onAuthSuccess={handleAuthSuccess}
              onNavigate={setActivePage}
              initialMode="login"
            />
          );
        }
        return (
          <Dashboard 
            currentUser={currentUser}
            onNavigate={setActivePage}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectTool={setActivePage}
          />
        );
      case 'pricing':
        return (
          <Pricing 
            currentUser={currentUser}
            onUpgradeSuccess={handleUpgradeSuccess}
            onNavigate={setActivePage}
          />
        );
      case 'api':
        return <ApiDocs />;
      case 'login':
        return (
          <Auth 
            onAuthSuccess={handleAuthSuccess}
            onNavigate={setActivePage}
            initialMode="login"
          />
        );
      case 'signup':
        return (
          <Auth 
            onAuthSuccess={handleAuthSuccess}
            onNavigate={setActivePage}
            initialMode="signup"
          />
        );
      case 'privacy':
      case 'terms':
        return <Legal />;
      default:
        return (
          <Home 
            onSelectTool={setActivePage}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onQuickUpload={handleQuickUploadLaunch}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Dynamic Header navbar navigation component */}
      <Navbar 
        currentUser={currentUser}
        onNavigate={setActivePage}
        onLogout={handleLogout}
        activePage={activePage}
      />

      {/* Main viewport area, aligned with standard responsive SaaS structures */}
      <main className="flex-grow">
        {renderActivePage()}
      </main>

      {/* Responsive footer element with compliance tags */}
      <Footer onNavigate={setActivePage} />
    </div>
  );
}
