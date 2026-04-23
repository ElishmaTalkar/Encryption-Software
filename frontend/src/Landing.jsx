import React, { useState, useEffect } from 'react';
import { Shield, Zap, Lock, Users, Cpu, Activity, Globe, Command, ShieldCheck, Wind, Ghost, Database, Key } from 'lucide-react';
import './Landing.css';

const Landing = ({ onGetStarted }) => {
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('darkmode') === 'active');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('darkmode');
    } else {
      document.body.classList.remove('darkmode');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkmode', newMode ? 'active' : 'null');
  };

  return (
    <div className="landing-wrapper">
      <header className="header" id="header">
        <nav className="navbar container">
          <a href="#" className="brand">VAULT</a>
          <div 
            className={`burger ${isMenuOpen ? 'is-active' : ''}`} 
            id="burger" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className="burger-line"></span>
            <span className="burger-line"></span>
            <span className="burger-line"></span>
          </div>
          <div className={`menu ${isMenuOpen ? 'is-active' : ''}`} id="menu">
            <ul className="menu-inner">
              <li className="menu-item"><a href="#" className="menu-link">Home</a></li>
              <li className="menu-item"><a href="#" className="menu-link">Feature</a></li>
              <li className="menu-item"><a href="#" className="menu-link">Pricing</a></li>
              <li className="menu-item"><a href="#" className="menu-link">Support</a></li>
            </ul>
          </div>
          <button className="switch" id="switch" onClick={toggleDarkMode}>
             {isDarkMode ? <i className="bx bx-sun"></i> : <i className="bx bx-moon"></i>}
          </button>
        </nav>
      </header>

      <main className="main">
        <section className="section banner-section">
          <div className="container banner-column">
            <div className="banner-image">
              <div className="lock-mask">
                <img 
                  src="/revolving_lock.png" 
                  alt="3D Revolving Lock" 
                  className="lock-hero-asset"
                />
              </div>
            </div>
            <div className="banner-inner">
              <span className="premium-tag">V4.0 PROTOCOL</span>
              <h1 className="heading-xl">
                Stateless. <br />
                Secure. <br />
                Zero-Knowledge.
              </h1>
              <p className="paragraph">
                Experience the first borderless, zero-knowledge communication node. 
                Your conversations, keys, and identity remain yours alone—decentralized, 
                sharded, and mathematically private.
              </p>
              <button 
                className="btn btn-darken btn-inline premium-button" 
                onClick={onGetStarted}
              >
                Enter the Vault<i className="bx bx-right-arrow-alt"></i>
              </button>
            </div>
          </div>
        </section>

        <section className="section sync-showcase-section">
          <div className="container sync-container">
            {/* Left Side: Infinite Scroller */}
            <div className="sync-scroller-card glass-panel">
              <div className="fade-top"></div>
              <div className="sync-scroll-inner">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="sync-scroll-group">
                    <div className="sync-item">
                      <div className="sync-left">
                        <div className="sync-icon-box"><Shield size={20} /></div>
                        <div>
                          <p className="sync-title">ZK-Handshake Flow</p>
                          <p className="sync-subtitle">Establishing secure client-side tunnel...</p>
                        </div>
                      </div>
                      <span className="sync-badge-live">LIVE</span>
                    </div>
                    <div className="sync-item">
                      <div className="sync-left">
                        <div className="sync-icon-box"><Lock size={20} /></div>
                        <div>
                          <p className="sync-title">Quantum-Resistant Rotation</p>
                          <p className="sync-subtitle">Cycling E2E ephemeral session keys</p>
                        </div>
                      </div>
                    </div>
                    <div className="sync-item">
                      <div className="sync-left">
                        <div className="sync-icon-box"><Users size={20} /></div>
                        <div>
                          <p className="sync-title">Message Sharding</p>
                          <p className="sync-subtitle">Broadcasting encrypted fragments to nodes</p>
                        </div>
                      </div>
                    </div>
                    <div className="sync-item">
                      <div className="sync-left">
                        <div className="sync-icon-box"><Cpu size={20} /></div>
                        <div>
                          <p className="sync-title">Vault Secret Verify</p>
                          <p className="sync-subtitle">Local biometric key-file checked</p>
                        </div>
                      </div>
                    </div>
                    <div className="sync-item">
                      <div className="sync-left">
                        <div className="sync-icon-box"><Activity size={20} /></div>
                        <div>
                          <p className="sync-title">Relay Matrix Bridge</p>
                          <p className="sync-subtitle">Global node synchronization active</p>
                        </div>
                      </div>
                    </div>
                    <div className="sync-item">
                      <div className="sync-left">
                        <div className="sync-icon-box"><Command size={20} /></div>
                        <div>
                          <p className="sync-title">Hardened Audit Trail</p>
                          <p className="sync-subtitle">Committing immutable vault activity log</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="fade-bottom"></div>
            </div>

            {/* Right Side: Content */}
            <div className="sync-content">
              <span className="premium-badge">VAULT NEURAL CORE</span>
              <h2 className="heading-xl">The Living <br />Security Matrix.</h2>
              <p className="paragraph">
                Our infrastructure is a living, breathing entity. 
                VAULT’s Neural Core manages millions of cryptographic handshakes 
                and message shards every second, ensuring your data never exists 
                as a whole anywhere but on your own device.
              </p>
              <div className="sync-stats-grid">
                <div className="stat-box">
                  <p className="stat-value">2.4M+</p>
                  <p className="stat-label">Shards Relay</p>
                </div>
                <div className="stat-box">
                  <p className="stat-value">{'<'} 1ms</p>
                  <p className="stat-label">Sync Latency</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section capabilities-section">
          <div className="container">
            <div className="capabilities-header text-center mb-4">
              <span className="premium-badge">CORE CAPABILITIES</span>
              <h2 className="heading-lg">Why the Vault?</h2>
              <p className="paragraph" style={{ maxWidth: '600px', margin: '0.5rem auto' }}>
                Engineered for maximum stateless privacy. Here is why VAULT leads the era of 
                mathematically proven security.
              </p>
            </div>
            
            <div className="capabilities-grid">
              {/* THE WHY - BETTER */}
              <div className="cap-card glass-panel">
                <ShieldCheck className="cap-icon" />
                <h3 className="heading-md">Math-Based Privacy</h3>
                <p className="paragraph-sm">Uses ZK-SNARKs to prove data validity without revealing the data itself. Pure math, no trust needed.</p>
              </div>
              <div className="cap-card glass-panel">
                <Wind className="cap-icon" />
                <h3 className="heading-md">Stateless Architecture</h3>
                <p className="paragraph-sm">Data exists only in transit. No permanent storage on relay nodes means no footprint left behind.</p>
              </div>
              <div className="cap-card glass-panel">
                <Ghost className="cap-icon" />
                <h3 className="heading-md">Ghost Metadata</h3>
                <p className="paragraph-sm">Proprietary protocols that scrub routing metadata, making even the existence of a connection invisible.</p>
              </div>

              {/* THE WHAT - FEATURES */}
              <div className="cap-card glass-panel">
                <Command className="cap-icon" />
                <h3 className="heading-md">Sharded Messaging</h3>
                <p className="paragraph-sm">Messages are split into cryptographic shards and routed through distinct global relay nodes.</p>
              </div>
              <div className="cap-card glass-panel">
                <Database className="cap-icon" />
                <h3 className="heading-md">Cold Vault Storage</h3>
                <p className="paragraph-sm">Offline-first local storage for your keys and sensitive files with automated node-sync.</p>
              </div>
              <div className="cap-card glass-panel">
                <Key className="cap-icon" />
                <h3 className="heading-md">Quantum Protection</h3>
                <p className="paragraph-sm">Future-proof encryption pipelines designed to withstand post-quantum decryption threats.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
};

export default Landing;
