import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Search, 
  Bot, 
  BarChart3, 
  Trophy, 
  ClipboardList, 
  MessageSquare, 
  User,
  Settings, 
  LogOut,
  Menu
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, color: 'purple' },
    { name: 'My Courses', path: '/my-courses', icon: BookOpen, color: 'blue' },
    { name: 'Browse Courses', path: '/browse-courses', icon: Search, color: 'indigo' },
    { name: 'AI Recommendations', path: '/recommendations', icon: Bot, color: 'purple' },
    { name: 'Progress', path: '/progress', icon: BarChart3, color: 'blue' },
    { name: 'Achievements', path: '/achievements', icon: Trophy, color: 'orange' },
    { name: 'Test Series', path: '/test-series', icon: ClipboardList, color: 'purple' },
    { name: 'Messages', path: '/messages', icon: MessageSquare, color: 'indigo' },
    { name: 'My Profile', path: '/profile', icon: User, color: 'green' },
    { name: 'Settings', path: '/settings', icon: Settings, color: 'orange' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('learnai_tokens');
    localStorage.removeItem('learnai_session');
    window.location.href = 'login.html';
  };

  return (
    <aside className={`sidebar ${isOpen ? 'active' : ''}`} id="sidebar">
      <div className="sidebar-header">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h2 className="logo">LearnAI</h2>
        </Link>
        <button className="sidebar-toggle" onClick={toggleSidebar}><Menu /></button>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.name} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => { if(window.innerWidth <= 1024) toggleSidebar(); }}
          >
            <span className="nav-icon">
              <span className={`icon-3d-wrapper icon-sm icon-${item.color}`}>
                <item.icon size={18} />
              </span>
            </span>
            <span className="nav-text">{item.name}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
          <span className="nav-icon">
            <span className="icon-3d-wrapper icon-sm icon-red">
              <LogOut size={16} />
            </span>
          </span>
          <span className="nav-text">Logout</span>
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
