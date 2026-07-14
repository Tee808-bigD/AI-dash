import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAgents } from '../context/AgentContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import { LayoutDashboard, Bot, Workflow, Zap, Users, Webhook, Menu, X, LogIn, UserCheck } from 'lucide-react';

export default function Header() {
  const location = useLocation();
  const { stats } = useAgents();
  const { user, configured, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/agents', label: 'Agents', icon: Bot },
    { path: '/workflows', label: 'Workflows', icon: Workflow },
    { path: '/integrations', label: 'Integrations', icon: Webhook },
  ];

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="header" role="banner">
      <div className="container nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/" className="brand" aria-label="AI Agent Dashboard Home" onClick={closeMenu}>
            <div className="brand-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="brand-svg">
                {/* Hexagon backdrop */}
                <path d="M14 2L24.5 8.5V19.5L14 26L3.5 19.5V8.5L14 2Z" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
                {/* Neural network nodes and connections */}
                <circle cx="14" cy="7" r="2.5" fill="url(#av-grad)" />
                <circle cx="21" cy="14" r="2.5" fill="url(#av-grad)" />
                <circle cx="14" cy="21" r="2.5" fill="url(#av-grad)" />
                <circle cx="7" cy="14" r="2.5" fill="url(#av-grad)" />
                {/* Center node */}
                <circle cx="14" cy="14" r="3.5" fill="url(#av-grad)" />
                <circle cx="14" cy="14" r="1.5" fill="white" opacity="0.9" />
                {/* Connection lines */}
                <line x1="14" y1="9.5" x2="14" y2="10.5" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
                <line x1="18.5" y1="11.5" x2="17" y2="12.5" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
                <line x1="14" y1="17.5" x2="14" y2="18.5" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
                <line x1="9.5" y1="11.5" x2="11" y2="12.5" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
                <line x1="17" y1="15.5" x2="18.5" y2="16.5" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
                <line x1="11" y1="15.5" x2="9.5" y2="16.5" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
                {/* Gradient definition */}
                <defs>
                  <linearGradient id="av-grad" x1="0" y1="0" x2="28" y2="28">
                    <stop offset="0%" stopColor="#6c5ce7" />
                    <stop offset="100%" stopColor="#a29bfe" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="brand-text">
              AgentVerse
            </span>
          </Link>
          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <nav aria-label="Main navigation" className={`nav-wrapper ${menuOpen ? 'nav-open' : ''}`}>
            <ul className="nav-links">
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                      aria-current={location.pathname === item.path ? 'page' : undefined}
                      onClick={closeMenu}
                    >
                      <Icon size={16} aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="header-status">
          <div className="status-badge status-active">
            <Zap size={12} />
            {stats.activeTasks} Active
          </div>
          <div className="status-badge header-agent-count">
            <Users size={12} />
            {stats.totalAgents} Agents
          </div>
          {configured && (
            user ? (
              <button
                className="status-badge"
                onClick={signOut}
                title="Sign out"
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <UserCheck size={12} style={{ color: '#2ecc71' }} />
                <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </span>
              </button>
            ) : (
              <button
                className="status-badge"
                onClick={() => setShowAuth(true)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <LogIn size={12} />
                Sign In
              </button>
            )
          )}
        </div>
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </header>
  );
}
