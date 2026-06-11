import React, { useState, useEffect } from 'react';
import { Search, Bell, Menu, User, Home, LayoutDashboard, Settings, LogOut, X, Check, Trash2, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE = 'http://localhost:3001/api';

const Topbar = ({ toggleSidebar }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [user, setUser] = useState({ name: 'User', email: 'user@example.com', avatar: null });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('learnai_session');
    if (session) {
      try {
        const userData = JSON.parse(session);
        const name = userData.name || userData.full_name || 'User';
        const firstName = name.split(' ')[0];
        setUser({
          name: firstName,
          fullName: name,
          email: userData.email || 'user@example.com',
          avatar: null,
          id: userData.id,
        });
        // Fetch real avatar from profile API
        if (userData.id) {
          fetch(`${API_BASE}/profile/${userData.id}`)
            .then(r => r.json())
            .then(data => {
              if (data.success && data.profile?.avatar_url) {
                setUser(prev => ({ ...prev, avatar: data.profile.avatar_url }));
              }
            })
            .catch(() => {});
          
          // Load notifications
          loadNotifications(userData.id);
          loadUnreadCount(userData.id);
          
          // Poll for new notifications every 30 seconds
          const interval = setInterval(() => {
            loadUnreadCount(userData.id);
          }, 30000);
          
          return () => clearInterval(interval);
        }
      } catch (e) {}
    }
  }, []);

  const loadNotifications = async (userId) => {
    setLoadingNotifications(true);
    try {
      const res = await fetch(`${API_BASE}/notifications/${userId}?limit=20`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error('Error loading notifications:', e);
    }
    setLoadingNotifications(false);
  };

  const loadUnreadCount = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/${userId}/count`);
      const data = await res.json();
      if (data.success) {
        setUnreadCount(data.count);
      }
    } catch (e) {
      console.error('Error loading unread count:', e);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error('Error marking as read:', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/${user.id}/read-all`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (e) {
      console.error('Error marking all as read:', e);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        const notification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (notification && !notification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (e) {
      console.error('Error deleting notification:', e);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      setShowNotifications(false);
      window.location.hash = notification.link;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.user-profile') && !e.target.closest('.user-dropdown')) {
        setShowDropdown(false);
      }
      if (!e.target.closest('.notification-btn') && !e.target.closest('.notification-dropdown')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('learnai_tokens');
    localStorage.removeItem('learnai_session');
    window.location.href = 'login.html';
  };

  const avatarSrc = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.name)}&background=6B7280&color=fff&size=80`;

  const getNotificationIcon = (type) => {
    const icons = {
      'course_enrolled': '📚',
      'lesson_completed': '✅',
      'achievement_unlocked': '🏆',
      'quiz_passed': '🎯',
      'quiz_failed': '❌',
      'message_received': '💬',
      'course_completed': '🎓',
      'certificate_earned': '📜',
      'test_available': '📝',
      'test_result': '📊',
      'recommendation': '✨',
      'system': '🔔'
    };
    return icons[type] || '🔔';
  };

  const formatNotificationTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    
    return time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="mobile-menu-btn" onClick={toggleSidebar}><Menu /></button>
      </div>

      <div className="topbar-right">
        <button 
          className="notification-btn" 
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>

        {/* Notification Dropdown */}
        {showNotifications && (
          <div className="notification-dropdown">
            <div className="notification-header">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <button className="mark-all-read-btn" onClick={markAllAsRead}>
                  <CheckCheck size={16} />
                  Mark all read
                </button>
              )}
            </div>

            <div className="notification-list">
              {loadingNotifications ? (
                <div className="notification-loading">
                  <div className="spinner" />
                  <p>Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="notification-empty">
                  <Bell size={48} color="#d1d5db" />
                  <p>No notifications yet</p>
                  <span>We'll notify you when something new arrives</span>
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-content">
                      <div className="notification-icon" data-type={notification.type}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="notification-text">
                        <h4>{notification.title}</h4>
                        <p>{notification.message}</p>
                        <span className="notification-time">
                          {formatNotificationTime(notification.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="notification-actions">
                      {!notification.is_read && (
                        <button
                          className="notification-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        className="notification-action-btn delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="notification-footer">
                <Link 
                  to="/notifications" 
                  onClick={() => setShowNotifications(false)}
                >
                  View all notifications
                </Link>
              </div>
            )}
          </div>
        )}

        {/* User pill */}
        <div className="user-profile" onClick={() => setShowDropdown(!showDropdown)}>
          <img
            src={avatarSrc}
            alt={user.name}
            onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6B7280&color=fff&size=80`; }}
          />
          <span className="user-name">{user.name}</span>
        </div>

        {/* Dropdown */}
        <div className={`user-dropdown ${showDropdown ? 'show' : ''}`}>
          <div className="dropdown-header">
            <img
              src={avatarSrc}
              alt={user.name}
              onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6B7280&color=fff&size=80`; }}
            />
            <div className="dropdown-user-info">
              <h4>{user.fullName || user.name}</h4>
              <p>{user.email}</p>
            </div>
          </div>
          <ul className="dropdown-menu">
            <li>
              <a href="index.html">
                <span className="icon-3d-wrapper icon-sm icon-blue" style={{ marginRight: '10px' }}><Home size={14} /></span>
                Home
              </a>
            </li>
            <li>
              <Link to="/" onClick={() => setShowDropdown(false)}>
                <span className="icon-3d-wrapper icon-sm icon-purple" style={{ marginRight: '10px' }}><LayoutDashboard size={14} /></span>
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/profile" onClick={() => setShowDropdown(false)}>
                <span className="icon-3d-wrapper icon-sm icon-green" style={{ marginRight: '10px' }}><User size={14} /></span>
                My Profile
              </Link>
            </li>
            <li>
              <Link to="/settings" onClick={() => setShowDropdown(false)}>
                <span className="icon-3d-wrapper icon-sm icon-orange" style={{ marginRight: '10px' }}><Settings size={14} /></span>
                Settings
              </Link>
            </li>
            <li className="dropdown-divider"></li>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                <span className="icon-3d-wrapper icon-sm icon-red" style={{ marginRight: '10px' }}><LogOut size={14} /></span>
                Logout
              </a>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
