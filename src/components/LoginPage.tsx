import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Store the logged-in user's email
    localStorage.setItem('currentUser', email);
    // No validation required - accept any email and password
    navigate('/main');
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