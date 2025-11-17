import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserRoles {
  inputUser: boolean;
  reviewer: boolean;
}

interface UsersData {
  [email: string]: UserRoles;
}

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UsersData>({});
  const [currentUser, setCurrentUser] = useState<string>('');

  const predefinedUsers = [
    'timothy.collins@ingka.ikea.com',
    'bschilke@ingka.ikea.com'
  ];

  useEffect(() => {
    // Load current user
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(user);
    }

    // Load existing user roles from localStorage
    const savedRoles = localStorage.getItem('userRoles');
    if (savedRoles) {
      try {
        setUsers(JSON.parse(savedRoles));
      } catch (error) {
        console.error('Failed to parse saved user roles:', error);
        // Initialize with default roles if parsing fails
        initializeDefaultRoles();
      }
    } else {
      // Initialize with default roles
      initializeDefaultRoles();
    }
  }, []);

  const initializeDefaultRoles = () => {
    const defaultUsers: UsersData = {};
    predefinedUsers.forEach(email => {
      defaultUsers[email] = {
        inputUser: true,
        reviewer: true
      };
    });
    setUsers(defaultUsers);
    localStorage.setItem('userRoles', JSON.stringify(defaultUsers));
  };

  const handleRoleChange = (email: string, role: keyof UserRoles, checked: boolean) => {
    const updatedUsers = {
      ...users,
      [email]: {
        ...users[email],
        [role]: checked
      }
    };
    setUsers(updatedUsers);
    localStorage.setItem('userRoles', JSON.stringify(updatedUsers));
  };

  const handleSaveChanges = () => {
    alert('User roles have been saved successfully!');
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>🔧 Admin Panel - User Role Management</h1>
        <div className="admin-nav">
          <button 
            onClick={() => navigate('/main')}
            className="nav-button"
          >
            📊 Go to Main
          </button>
          <button 
            onClick={() => navigate('/review')}
            className="nav-button"
          >
            🔍 Go to Review
          </button>
          <button 
            onClick={() => navigate('/published')}
            className="nav-button"
          >
            📋 Go to Published
          </button>
        </div>
      </div>

      <div className="admin-content">
        <div className="current-user-info">
          <h3>Current User: {currentUser || 'Not logged in'}</h3>
        </div>

        <div className="users-management">
          <h2>User Permissions</h2>
          <p>Manage user roles and permissions for the sales planning application.</p>
          
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>User Email</th>
                  <th>Input User</th>
                  <th>Reviewer</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {predefinedUsers.map(email => (
                  <tr key={email}>
                    <td className="user-email">{email}</td>
                    <td className="role-checkbox">
                      <label>
                        <input
                          type="checkbox"
                          checked={users[email]?.inputUser || false}
                          onChange={(e) => handleRoleChange(email, 'inputUser', e.target.checked)}
                        />
                        <span className="checkmark">✓</span>
                      </label>
                    </td>
                    <td className="role-checkbox">
                      <label>
                        <input
                          type="checkbox"
                          checked={users[email]?.reviewer || false}
                          onChange={(e) => handleRoleChange(email, 'reviewer', e.target.checked)}
                        />
                        <span className="checkmark">✓</span>
                      </label>
                    </td>
                    <td className="user-status">
                      {users[email]?.inputUser && users[email]?.reviewer ? (
                        <span className="status-both">Input User & Reviewer</span>
                      ) : users[email]?.inputUser ? (
                        <span className="status-input">Input User Only</span>
                      ) : users[email]?.reviewer ? (
                        <span className="status-reviewer">Reviewer Only</span>
                      ) : (
                        <span className="status-none">No Permissions</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-actions">
            <button 
              onClick={handleSaveChanges}
              className="save-button"
            >
              💾 Save Changes
            </button>
            <button 
              onClick={initializeDefaultRoles}
              className="reset-button"
            >
              🔄 Reset to Default
            </button>
          </div>
        </div>

        <div className="role-descriptions">
          <h3>Role Descriptions</h3>
          <div className="role-info">
            <div className="role-item">
              <h4>📝 Input User</h4>
              <p>Can create new sales plans, edit plan data, and submit plans for review.</p>
            </div>
            <div className="role-item">
              <h4>🔍 Reviewer</h4>
              <p>Can review submitted plans, approve/deny individual rows, and publish approved plans.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;