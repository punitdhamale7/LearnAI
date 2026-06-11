import { useState, useEffect } from 'react';
import { Bell, Shield, Lock, Eye, Moon, Globe, HelpCircle, Sun, X, AlertCircle, CheckCircle } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

function getSession() {
  try { return JSON.parse(localStorage.getItem('learnai_session')); } catch { return null; }
}

function getDarkMode() {
  return localStorage.getItem('learnai_theme') === 'dark';
}

function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  localStorage.setItem('learnai_theme', dark ? 'dark' : 'light');
}

export default function Settings() {
  const session = getSession();
  const userId = session?.id;
  
  const [darkMode, setDarkMode] = useState(getDarkMode);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Apply on mount
  useEffect(() => { applyTheme(darkMode); }, []);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    applyTheme(next);
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/profile/${userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword
        })
      });

      const data = await res.json();

      if (data.success) {
        setPasswordSuccess('Password updated successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess('');
        }, 2000);
      } else {
        setPasswordError(data.message || 'Failed to update password');
      }
    } catch (error) {
      setPasswordError('Error updating password. Please try again.');
    }

    setIsSubmitting(false);
  };

  const openPasswordModal = () => {
    setShowPasswordModal(true);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setPasswordSuccess('');
  };

  const settingGroups = [
    {
      title: 'Account Settings',
      items: [
        { icon: <Lock size={20} />,    label: 'Security & Password', desc: 'Manage your password and security settings', color: 'orange', onClick: openPasswordModal },
        { icon: <Bell size={20} />,    label: 'Notifications',       desc: 'Choose what notifications you want to receive', color: 'blue' },
        { icon: <Shield size={20} />,  label: 'Privacy',             desc: 'Control who can see your profile and activity', color: 'green' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: <Eye size={20} />,     label: 'Appearance',       desc: 'Customize your dashboard theme and layout', color: 'purple' },
        { icon: <Globe size={20} />,   label: 'Language & Region', desc: 'Set your preferred language and time zone', color: 'indigo' },
        {
          icon: darkMode ? <Sun size={20} /> : <Moon size={20} />,
          label: 'Dark Mode',
          desc: darkMode ? 'Currently: Dark — click to switch to Light' : 'Currently: Light — click to switch to Dark',
          color: 'blue',
          isToggle: true,
        }
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: <HelpCircle size={20} />, label: 'Help Center', desc: 'Find answers to common questions', color: 'orange' }
      ]
    }
  ];

  return (
    <div className="dashboard-container">
      <div className="section-header">
        <h1>Settings</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {settingGroups.map((group, i) => (
          <div key={i}>
            <h3 style={{
              fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '1rem'
            }}>
              {group.title}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
              {group.items.map((item, j) => (
                <div
                  key={j}
                  onClick={item.isToggle ? toggleDark : item.onClick || undefined}
                  style={{
                    background: 'var(--bg-card)',
                    padding: '1.25rem 1.5rem',
                    borderBottom: j < group.items.length - 1 ? '1px solid var(--border)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: (item.isToggle || item.onClick) ? 'pointer' : 'default',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-main)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <span className={`icon-3d-wrapper icon-md icon-${item.color}`}>{item.icon}</span>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '3px', color: 'var(--text-main)' }}>
                        {item.label}
                      </h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  {item.isToggle ? (
                    /* Working dark mode toggle */
                    <button
                      className={`dark-toggle ${darkMode ? 'on' : ''}`}
                      onClick={e => { e.stopPropagation(); toggleDark(); }}
                      aria-label="Toggle dark mode"
                      title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                      <div className="dark-toggle-thumb" />
                    </button>
                  ) : (
                    <span style={{ color: 'var(--text-light)', fontSize: '18px' }}>›</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPasswordModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleSection}>
                <div style={styles.modalIconWrapper}>
                  <Lock size={20} color="#fff" />
                </div>
                <h2 style={styles.modalTitle}>Change Password</h2>
              </div>
              <button style={styles.closeBtn} onClick={() => setShowPasswordModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} style={styles.form}>
              {passwordError && (
                <div style={styles.errorAlert}>
                  <AlertCircle size={16} />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div style={styles.successAlert}>
                  <CheckCircle size={16} />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  style={styles.input}
                  placeholder="Enter your current password"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  style={styles.input}
                  placeholder="Enter new password (min 8 characters)"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  style={styles.input}
                  placeholder="Re-enter new password"
                  required
                />
              </div>

              <div style={styles.passwordRequirements}>
                <p style={styles.requirementsTitle}>Password Requirements:</p>
                <ul style={styles.requirementsList}>
                  <li style={{
                    ...styles.requirementItem,
                    color: passwordData.newPassword.length >= 8 ? '#10b981' : '#6b7280'
                  }}>
                    At least 8 characters
                  </li>
                  <li style={{
                    ...styles.requirementItem,
                    color: passwordData.newPassword && passwordData.newPassword === passwordData.confirmPassword ? '#10b981' : '#6b7280'
                  }}>
                    Passwords match
                  </li>
                  <li style={{
                    ...styles.requirementItem,
                    color: passwordData.newPassword && passwordData.currentPassword && passwordData.newPassword !== passwordData.currentPassword ? '#10b981' : '#6b7280'
                  }}>
                    Different from current password
                  </li>
                </ul>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    ...styles.submitBtn,
                    opacity: isSubmitting ? 0.6 : 1,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modalContent: {
    background: 'var(--bg-card)',
    width: '100%',
    maxWidth: '500px',
    border: '1px solid var(--border)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    borderBottom: '1px solid var(--border)'
  },
  modalTitleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  modalIconWrapper: {
    width: '40px',
    height: '40px',
    background: '#f97316',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--text-main)',
    margin: 0
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s'
  },
  form: {
    padding: '24px'
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    fontSize: '14px',
    marginBottom: '20px'
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#16a34a',
    fontSize: '14px',
    marginBottom: '20px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-main)',
    marginBottom: '8px'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    border: '1px solid var(--border)',
    background: 'var(--bg-main)',
    color: 'var(--text-main)',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  },
  passwordRequirements: {
    padding: '16px',
    background: 'var(--bg-main)',
    border: '1px solid var(--border)',
    marginBottom: '24px'
  },
  requirementsTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-main)',
    marginBottom: '8px',
    margin: 0
  },
  requirementsList: {
    margin: '8px 0 0 0',
    paddingLeft: '20px',
    listStyle: 'disc'
  },
  requirementItem: {
    fontSize: '13px',
    marginBottom: '4px'
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  },
  cancelBtn: {
    padding: '12px 24px',
    background: 'var(--bg-main)',
    border: '1px solid var(--border)',
    color: 'var(--text-main)',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  submitBtn: {
    padding: '12px 24px',
    background: '#f97316',
    border: 'none',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};
