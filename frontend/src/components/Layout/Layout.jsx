import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const navItems = [
  { to: '/dashboard', icon: '⚡', label: 'Dashboard' },
  { to: '/meals', icon: '🍽️', label: 'Meals' },
  { to: '/workouts', icon: '🏋️', label: 'Workouts' },
  { to: '/chat', icon: '💬', label: 'Assistant' },
  { to: '/progress', icon: '📈', label: 'Progress' },
  { to: '/profile', icon: '👤', label: 'Profile' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={closeMobile} />
      )}

      {/* Sidebar */}
      <aside
        className="sidebar"
        style={{ transform: mobileOpen ? 'translateX(0)' : undefined }}
      >
        <div className="sidebar-logo">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">AF</div>
            <div>
              <div className="sidebar-brand-text">AdaptiveFit</div>
              <div className="sidebar-brand-sub">AI Fitness Coach</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeMobile}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-item-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user?.fullName?.[0]?.toUpperCase() || '?'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div className="sidebar-user-name">{user?.fullName}</div>
              <div className="sidebar-user-email">{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm btn-full">
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="mobile-header">
        <button onClick={() => setMobileOpen(true)} className="mobile-hamburger">
          ☰
        </button>
        <span className="mobile-brand">AdaptiveFit</span>
        <div style={{ width: 36 }} />
      </div>

      {/* Main content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
