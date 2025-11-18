import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserRoles {
  inputUser: boolean;
  reviewer: boolean;
  admin: boolean;
}

interface UsersData {
  [email: string]: UserRoles;
}

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  
  const predefinedUsers = [
    'timothy.collins@ingka.ikea.com',
    'bschilke@ingka.ikea.com'
  ];

  // Check if current user has reviewer role
  const checkUserRole = (role: 'inputUser' | 'reviewer' | 'admin'): boolean => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return false;
    
    const userRoles = localStorage.getItem('userRoles');
    
    // If no userRoles exist and this is timothy.collins, auto-initialize as admin
    if (!userRoles && currentUser === 'timothy.collins@ingka.ikea.com') {
      const defaultUsers: UsersData = {};
      predefinedUsers.forEach(email => {
        defaultUsers[email] = {
          inputUser: true,
          reviewer: true,
          admin: email === 'timothy.collins@ingka.ikea.com'
        };
      });
      localStorage.setItem('userRoles', JSON.stringify(defaultUsers));
      return role === 'admin' || role === 'inputUser' || role === 'reviewer'; // timothy.collins has all roles
    }
    
    if (!userRoles) return false;
    
    try {
      const roles = JSON.parse(userRoles);
      return roles[currentUser]?.[role] || false;
    } catch (error) {
      console.error('Failed to parse user roles:', error);
      return false;
    }
  };

  const isReviewer = checkUserRole('reviewer');
  const isInputUser = checkUserRole('inputUser');
  const isAdmin = checkUserRole('admin');

  // Redirect non-admin users - but allow timothy.collins through
  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    console.log('AdminPage useEffect - currentUser:', currentUser);
    console.log('AdminPage useEffect - isAdmin:', isAdmin);
    
    // Always allow timothy.collins access to admin page
    if (currentUser === 'timothy.collins@ingka.ikea.com') {
      console.log('Timothy Collins detected in AdminPage - allowing access');
      return; // Allow access
    }
    
    // For other users, check admin role
    if (!isAdmin) {
      console.log('Non-admin user detected - redirecting to published');
      alert('Access denied. Only admin users can access the admin page.');
      navigate('/published');
      return;
    }
  }, [isAdmin]);
  
  const [users, setUsers] = useState<UsersData>({});
  const [currentUser, setCurrentUser] = useState<string>('');
  
  // New user form state
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserRoles, setNewUserRoles] = useState<UserRoles>({
    inputUser: true,
    reviewer: false,
    admin: false
  });
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>('');

  // Edit user state
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState<string>('');
  const [editEmailError, setEditEmailError] = useState<string>('');
  const [editingRoles, setEditingRoles] = useState<UserRoles>({
    inputUser: false,
    reviewer: false,
    admin: false
  });

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
        reviewer: true,
        admin: email === 'timothy.collins@ingka.ikea.com' // Only timothy.collins is admin
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
        reviewer: newUserRoles.reviewer,
        admin: newUserRoles.admin
      }
    };

    setUsers(updatedUsers);
    localStorage.setItem('userRoles', JSON.stringify(updatedUsers));
    
    // Reset form
    setNewUserEmail('');
    setNewUserRoles({ inputUser: true, reviewer: false, admin: false });
    setEmailError('');
    setShowAddForm(false);
    
    alert(`User ${newUserEmail} has been added successfully!`);
  };

  // Edit user functions
  const handleEditUser = (email: string) => {
    setEditingUser(email);
    setEditingEmail(email);
    setEditingRoles({
      inputUser: users[email]?.inputUser || false,
      reviewer: users[email]?.reviewer || false,
      admin: users[email]?.admin || false
    });
    setEditEmailError('');
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditingEmail('');
    setEditEmailError('');
    setEditingRoles({ inputUser: false, reviewer: false, admin: false });
  };

  const handleSaveEdit = () => {
    // Validate email if it was changed
    if (editingEmail !== editingUser) {
      const error = validateEmail(editingEmail);
      if (error) {
        setEditEmailError(error);
        return;
      }
    }

    const updatedUsers = { ...users };
    
    // If email was changed, remove old entry and add new one
    if (editingEmail !== editingUser && editingUser) {
      delete updatedUsers[editingUser];
    }
    
    // Add/update user with new email and roles
    updatedUsers[editingEmail] = {
      inputUser: editingRoles.inputUser,
      reviewer: editingRoles.reviewer,
      admin: editingRoles.admin
    };

    setUsers(updatedUsers);
    localStorage.setItem('userRoles', JSON.stringify(updatedUsers));
    
    // Reset edit state
    handleCancelEdit();
    
    alert(`User ${editingEmail} has been updated successfully!`);
  };

  const handleEditRoleChange = (role: keyof UserRoles, checked: boolean) => {
    setEditingRoles(prev => ({
      ...prev,
      [role]: checked
    }));
  };

  const handleDeleteUser = (email: string) => {
    if (window.confirm(`Are you sure you want to delete user ${email}? This action cannot be undone.`)) {
      const updatedUsers = { ...users };
      delete updatedUsers[email];
      setUsers(updatedUsers);
      localStorage.setItem('userRoles', JSON.stringify(updatedUsers));
      alert(`User ${email} has been deleted successfully!`);
      
      // If user deleted themselves, redirect to login
      if (email === currentUser) {
        localStorage.removeItem('currentUser');
        window.location.href = '/';
      }
    }
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
            {isInputUser && (
              <button 
                className="tab"
                onClick={() => navigate('/main')}
              >
                📋 Main
              </button>
            )}
            {isReviewer && (
              <button 
                className="tab"
                onClick={() => navigate('/review')}
              >
                📝 Review
              </button>
            )}
            <button 
              className="tab"
              onClick={() => navigate('/published')}
            >
              📊 Published
            </button>
            {isAdmin && (
              <button className="tab active">
                🔧 Admin
              </button>
            )}
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
                  <th>Admin</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allUserEmails.map(email => (
                  <tr key={email}>
                    <td className="user-email">
                      {editingUser === email ? (
                        <input
                          type="email"
                          value={editingEmail}
                          onChange={(e) => {
                            setEditingEmail(e.target.value);
                            if (editEmailError) setEditEmailError('');
                          }}
                          className={editEmailError ? 'error' : ''}
                          style={{ width: '200px', padding: '4px' }}
                        />
                      ) : (
                        email
                      )}
                      {editingUser === email && editEmailError && (
                        <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>
                          {editEmailError}
                        </div>
                      )}
                    </td>
                    <td className="role-checkbox">
                      <label>
                        <input
                          type="checkbox"
                          checked={editingUser === email ? editingRoles.inputUser : (users[email]?.inputUser || false)}
                          onChange={(e) => {
                            if (editingUser === email) {
                              handleEditRoleChange('inputUser', e.target.checked);
                            } else {
                              handleRoleChange(email, 'inputUser', e.target.checked);
                            }
                          }}
                          disabled={editingUser !== null && editingUser !== email}
                        />
                        <span className="checkmark">✓</span>
                      </label>
                    </td>
                    <td className="role-checkbox">
                      <label>
                        <input
                          type="checkbox"
                          checked={editingUser === email ? editingRoles.reviewer : (users[email]?.reviewer || false)}
                          onChange={(e) => {
                            if (editingUser === email) {
                              handleEditRoleChange('reviewer', e.target.checked);
                            } else {
                              handleRoleChange(email, 'reviewer', e.target.checked);
                            }
                          }}
                          disabled={editingUser !== null && editingUser !== email}
                        />
                        <span className="checkmark">✓</span>
                      </label>
                    </td>
                    <td className="role-checkbox">
                      <label>
                        <input
                          type="checkbox"
                          checked={editingUser === email ? editingRoles.admin : (users[email]?.admin || false)}
                          onChange={(e) => {
                            if (editingUser === email) {
                              handleEditRoleChange('admin', e.target.checked);
                            } else {
                              handleRoleChange(email, 'admin', e.target.checked);
                            }
                          }}
                          disabled={editingUser !== null && editingUser !== email}
                        />
                        <span className="checkmark">✓</span>
                      </label>
                    </td>
                    <td className="user-status">
                      {(() => {
                        const userRoles = editingUser === email ? editingRoles : users[email];
                        const roles = [];
                        if (userRoles?.admin) roles.push('Admin');
                        if (userRoles?.inputUser) roles.push('Input User');
                        if (userRoles?.reviewer) roles.push('Reviewer');
                        
                        if (roles.length === 0) {
                          return <span className="status-none">No Permissions</span>;
                        }
                        
                        const roleText = roles.join(' & ');
                        if (userRoles?.admin) {
                          return <span className="status-admin">{roleText}</span>;
                        } else if (userRoles?.inputUser && userRoles?.reviewer) {
                          return <span className="status-both">{roleText}</span>;
                        } else if (userRoles?.inputUser) {
                          return <span className="status-input">{roleText}</span>;
                        } else if (userRoles?.reviewer) {
                          return <span className="status-reviewer">{roleText}</span>;
                        }
                      })()}
                    </td>
                    <td className="user-actions">
                      {editingUser === email ? (
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            onClick={handleSaveEdit}
                            className="btn small-btn edit-btn"
                            title="Save changes"
                          >
                            💾 Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="btn small-btn cancel-btn"
                            title="Cancel editing"
                          >
                            ❌ Cancel
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            onClick={() => handleEditUser(email)}
                            className="btn small-btn edit-btn"
                            disabled={editingUser !== null}
                            title="Edit user"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(email)}
                            className="btn small-btn delete-btn"
                            disabled={editingUser !== null}
                            title="Delete user"
                          >
                            🗑️ Delete
                          </button>
                        </div>
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
                    <label className="role-checkbox-label">
                      <input
                        type="checkbox"
                        checked={newUserRoles.admin}
                        onChange={(e) => handleNewUserRoleChange('admin', e.target.checked)}
                      />
                      <span>Admin</span>
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
                    setNewUserRoles({ inputUser: true, reviewer: false, admin: false });
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
            <div className="role-item">
              <h4>🔧 Admin</h4>
              <p>Can manage user roles and permissions. Has access to the admin panel to add, edit, and delete users.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;