import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt for:', email);
    
    // Store the logged-in user's email
    localStorage.setItem('currentUser', email);
    
    // Check user roles and redirect accordingly
    const checkUserRole = (role: 'inputUser' | 'reviewer' | 'admin'): boolean => {
      const userRoles = localStorage.getItem('userRoles');
      console.log('Current userRoles in localStorage:', userRoles);
      
      // If no userRoles exist and this is timothy.collins, auto-initialize as admin
      if (!userRoles && email === 'timothy.collins@ingka.ikea.com') {
        console.log('Initializing default roles for timothy.collins');
        const predefinedUsers = [
          'timothy.collins@ingka.ikea.com',
          'bschilke@ingka.ikea.com'
        ];
        const defaultUsers: any = {};
        predefinedUsers.forEach(userEmail => {
          defaultUsers[userEmail] = {
            inputUser: true,
            reviewer: true,
            admin: userEmail === 'timothy.collins@ingka.ikea.com'
          };
        });
        localStorage.setItem('userRoles', JSON.stringify(defaultUsers));
        console.log('Created default roles:', defaultUsers);
        return role === 'admin' || role === 'inputUser' || role === 'reviewer'; // timothy.collins has all roles
      }
      
      if (!userRoles) return false;
      
      try {
        const roles = JSON.parse(userRoles);
        console.log('Parsed roles:', roles);
        console.log(`Checking ${email} for role ${role}:`, roles[email]?.[role]);
        return roles[email]?.[role] || false;
      } catch (error) {
        console.error('Failed to parse user roles:', error);
        return false;
      }
    };

    const isInputUser = checkUserRole('inputUser');
    const isReviewer = checkUserRole('reviewer');
    const isAdmin = checkUserRole('admin');

    console.log('User roles:', { isInputUser, isReviewer, isAdmin });

    // Special handling for timothy.collins - always redirect to admin FIRST
    if (email === 'timothy.collins@ingka.ikea.com') {
      console.log('Timothy Collins detected - redirecting to admin');
      navigate('/admin');
      return;
    }

    // Redirect based on user role priority (admin has highest priority):
    if (isAdmin) {
      console.log('Admin user - redirecting to admin');
      navigate('/admin');
    } else if (isInputUser) {
      console.log('Input user - redirecting to main');
      navigate('/main');
    } else if (isReviewer) {
      console.log('Reviewer user - redirecting to review');
      navigate('/review');
    } else {
      console.log('No roles - redirecting to published');
      navigate('/published');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>IKEA Sales Planning</h1>
          <h2>Please Log In</h2>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="login-btn">
            Log In
          </button>
        </form>

        <div className="login-footer">
          <p>Enter any email and password to continue</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;