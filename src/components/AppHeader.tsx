import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current user has specific role
  const checkUserRole = (role: 'inputUser' | 'reviewer' | 'admin'): boolean => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return false;
    
    // Special case for timothy.collins - always grant admin access
    if (currentUser === 'timothy.collins@ingka.ikea.com' && role === 'admin') {
      return true;
    }
    
    // Special case for timothy.collins - grant all roles
    if (currentUser === 'timothy.collins@ingka.ikea.com') {
      return true;
    }
    
    const userRoles = localStorage.getItem('userRoles');
    if (!userRoles) return false;
    
    try {
      const roles = JSON.parse(userRoles);
      return roles[currentUser]?.[role] || false;
    } catch (error) {
      console.error('Failed to parse user roles:', error);
      return false;
    }
  };

  const isInputUser = checkUserRole('inputUser');
  const isReviewer = checkUserRole('reviewer');
  const isAdmin = checkUserRole('admin');

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="app-header">
      <div className="header-title-row">
        <h1>IKEA Sales Planning</h1>
        <button
          className="btn logout-btn"
          onClick={() => navigate('/')}
          title="Return to home screen"
        >
          🚪 Logout
        </button>
      </div>
      
      {/* Tab Navigation */}
      <nav className="app-tabs">
        <div className="tab-container">
          {isInputUser && (
            <button 
              className={`tab ${isActive('/main') ? 'active' : ''}`}
              onClick={() => navigate('/main')}
            >
              📋 Main
            </button>
          )}
          {isReviewer && (
            <button 
              className={`tab ${isActive('/review') ? 'active' : ''}`}
              onClick={() => navigate('/review')}
            >
              📝 Review
            </button>
          )}
          <button 
            className={`tab ${isActive('/published') ? 'active' : ''}`}
            onClick={() => navigate('/published')}
          >
            📊 Published
          </button>
          {isAdmin && (
            <button 
              className={`tab ${isActive('/admin') ? 'active' : ''}`}
              onClick={() => navigate('/admin')}
            >
              🔧 Admin
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default AppHeader;
