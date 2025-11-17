import React, { useState, useEffect } from 'react';

interface UserRoles {
  inputUser: boolean;
  reviewer: boolean;
}

interface UsersData {
  [email: string]: UserRoles;
}

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<UsersData>({});
  const [currentUser, setCurrentUser] = useState<string>('');
  
  // New user form state
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserRoles, setNewUserRoles] = useState<UserRoles>({
    inputUser: true,
    reviewer: false
  });
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>('');

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

  // Email validation function
  const validateEmail = (email: string): string => {
    if (!email) return 'Email is required';
    if (!email.includes('@')) return 'Please enter a valid email address';
    if (!email.includes('.')) return 'Please enter a valid email address';
    if (users[email]) return 'User already exists';
    return '';
  };

  // Handle new user role change
  const handleNewUserRoleChange = (role: keyof UserRoles, checked: boolean) => {
    setNewUserRoles(prev => ({
      ...prev,
      [role]: checked
    }));
  };

  // Add new user function
  const handleAddUser = () => {
    const error = validateEmail(newUserEmail);
    if (error) {
      setEmailError(error);
      return;
    }

    const updatedUsers = {
      ...users,
      [newUserEmail]: {
        inputUser: newUserRoles.inputUser,
        reviewer: newUserRoles.reviewer
      }
    };

    setUsers(updatedUsers);
    localStorage.setItem('userRoles', JSON.stringify(updatedUsers));
    
    // Reset form
    setNewUserEmail('');
    setNewUserRoles({ inputUser: true, reviewer: false });
    setEmailError('');
    setShowAddForm(false);
    
    alert(`User ${newUserEmail} has been added successfully!`);
  };

  // Get all user emails (predefined + added)
  const allUserEmails = [...new Set([...predefinedUsers, ...Object.keys(users)])];

  return (
    <div className="admin-page">
      <header className="app-header">
        <h1>IKEA Sales Planning</h1>
        
        {/* Tab Navigation */}
        <nav className="app-tabs">
          <div className="tab-container">
            <a href="/main" className="tab">
              📋 Main
            </a>
            <a href="/review" className="tab">
              📝 Review
            </a>
            <a href="/published" className="tab">
              📊 Published
            </a>
            <button className="tab active">
              🔧 Admin
            </button>
          </div>
          
          <div className="app-actions">
            {/* Navigation handled by tabs - no need for back button */}
          </div>
        </nav>
      </header>

      <div className="admin-content">
        <div className="admin-section-header">
          <h2>🔧 Admin Panel - User Role Management</h2>
          <p>Manage user roles and permissions for the sales planning application.</p>
        </div>
        
        <div className="current-user-info">
          <h3>Current User: {currentUser || 'Not logged in'}</h3>
        </div>

        <div className="users-management">
          <h3>User Permissions</h3>
          
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
                {allUserEmails.map(email => (
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
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="add-user-button"
            >
              👤 Add New User
            </button>
          </div>

          {showAddForm && (
            <div className="add-user-form">
              <h3>Add New User</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="newUserEmail">Email Address:</label>
                  <input
                    type="email"
                    id="newUserEmail"
                    value={newUserEmail}
                    onChange={(e) => {
                      setNewUserEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    placeholder="user@ingka.ikea.com"
                    className={emailError ? 'error' : ''}
                  />
                  {emailError && <span className="error-message">{emailError}</span>}
                </div>
              </div>
              
              <div className="form-row">
                <div className="roles-selection">
                  <label>Roles:</label>
                  <div className="role-checkboxes">
                    <label className="role-checkbox-label">
                      <input
                        type="checkbox"
                        checked={newUserRoles.inputUser}
                        onChange={(e) => handleNewUserRoleChange('inputUser', e.target.checked)}
                      />
                      <span>Input User</span>
                    </label>
                    <label className="role-checkbox-label">
                      <input
                        type="checkbox"
                        checked={newUserRoles.reviewer}
                        onChange={(e) => handleNewUserRoleChange('reviewer', e.target.checked)}
                      />
                      <span>Reviewer</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  onClick={handleAddUser}
                  className="add-button"
                  disabled={!newUserEmail.trim()}
                >
                  ✅ Add User
                </button>
                <button 
                  onClick={() => {
                    setShowAddForm(false);
                    setNewUserEmail('');
                    setNewUserRoles({ inputUser: true, reviewer: false });
                    setEmailError('');
                  }}
                  className="cancel-button"
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          )}
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