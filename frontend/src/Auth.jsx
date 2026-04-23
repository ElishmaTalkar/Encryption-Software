import React, { useState } from 'react';
import { Shield, Lock, User, ArrowRight } from 'lucide-react';
import './Auth.css';

const Auth = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState('login'); // signup | login
  const [name, setName] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    // For now, we simulate success and pass the name up
    onAuthSuccess(name);
  };

  return (
    <div className="auth-wrapper">
      {/* Cinematic Ambient Background */}
      <div className="auth-bg">
        <div className="blob blob-purple"></div>
        <div className="blob blob-blue"></div>
      </div>

      {/* Glassmorphic Auth Card */}
      <div className="auth-card-container">
        <div className="glass-panel auth-card">
          <div className="auth-header">
            <h2>{mode === 'signup' ? 'Create Identity' : 'Welcome Back'}</h2>
            <p>Your secure keys are stored locally.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field">
              <label>Username</label>
              <div className="input-field">
                <User className="input-icon" size={18} />
                <input 
                  type="text" 
                  placeholder="vince_carter_99" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="field">
              <label>Passphrase</label>
              <div className="input-field">
                <Lock className="input-icon" size={18} />
                <input type="password" placeholder="••••••••••••" required />
              </div>
            </div>

            <button type="submit" className="auth-submit premium-button">
              {mode === 'signup' ? 'Begin Secure Session' : 'Unlock Now'}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="auth-footer">
            <button onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
              {mode === 'signup' ? 
                <>Already have an identity? <span>Login</span></> : 
                <>Need a new identity? <span>Sign up</span></>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
