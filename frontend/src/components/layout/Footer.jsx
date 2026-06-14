import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import Logo from '../shared/Logo';

const Footer = ({ variant = 'full' }) => {
  const currentYear = new Date().getFullYear();
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const checkScrollTop = () => {
      if (!showScroll && window.scrollY > 300) {
        setShowScroll(true);
      } else if (showScroll && window.scrollY <= 300) {
        setShowScroll(false);
      }
    };
    window.addEventListener('scroll', checkScrollTop);
    return () => window.removeEventListener('scroll', checkScrollTop);
  }, [showScroll]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (variant === 'minimal') {
    return (
      <footer className="py-4 text-center">
        <p className="text-sm text-[var(--text-muted)] m-0">
          &copy; {currentYear} EduAuth Registry.
        </p>
      </footer>
    );
  }

  return (
    <footer className="bg-[var(--bg-surface)] border-t border-[var(--border)] pt-[40px] pb-[24px] font-['Inter']">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 mb-16">
          
          {/* Left Column: Brand, Description, Socials */}
          <div className="lg:col-span-4 flex flex-col gap-6 xl:pr-8">
            <div>
              <Link to="/" className="inline-flex items-center gap-2 no-underline mb-4 outline-none group" aria-label="EduAuth Registry Home">
                <Logo className="w-8 h-8" />
                <span className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">
                  EduAuth Registry
                </span>
              </Link>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)] max-w-sm">
                The centralized digital platform for the secure issuance, management, and verification of academic credentials across Bangladeshi universities.
              </p>
            </div>

            {/* Social Links Stacked */}
            <div className="flex gap-3">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-[var(--text-muted)] w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border)] transition-all hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] outline-none">
                <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-[var(--text-muted)] w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border)] transition-all hover:text-[var(--brand)] hover:bg-[var(--bg-elevated)] outline-none">
                <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-[var(--text-muted)] w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border)] transition-all hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] outline-none">
                <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
              </a>
            </div>
          </div>

          {/* Right Columns: Platform -> Developers & Help -> Legal */}
          <nav className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-12" aria-label="Footer Navigation">
            
            {/* Column 1: Platform */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-5">Platform</h3>
              <ul className="flex flex-col gap-3.5">
                <li>
                  <Link to="/login" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    System Login
                  </Link>
                </li>
                <li>
                  <Link to="/verify" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    Verify a Certificate
                  </Link>
                </li>
                <li>
                  <Link to="/universities" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    Participating Universities
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Developers & Help */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-5">Developers & Help</h3>
              <ul className="flex flex-col gap-3.5">
                <li>
                  <Link to="/api-docs" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    Verification API
                  </Link>
                </li>
                <li>
                  <Link to="/help" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    Help Center & FAQs
                  </Link>
                </li>
                <li>
                  <Link to="/status" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    System Status
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    Contact Support
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Legal */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-5">Legal</h3>
              <ul className="flex flex-col gap-3.5">
                <li>
                  <Link to="/privacy" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/security" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    Security & Compliance
                  </Link>
                </li>
              </ul>
            </div>

          </nav>
        </div>

        {/* Bottom Bar: perfectly centered Copyright */}
        <div className="border-t border-[var(--border)] pt-8 flex items-center justify-center">
          <p className="text-sm text-[var(--text-muted)] m-0 text-center">
            &copy; {currentYear} EduAuth Registry. All rights reserved.
          </p>
        </div>
      </div>

      {/* Floating Back to Top Button */}
      <button 
        onClick={scrollToTop} 
        className={`fixed bottom-8 right-8 z-50 p-3 rounded-full bg-[var(--brand)] text-white shadow-lg cursor-pointer transition-all duration-300 outline-none hover:bg-blue-700 hover:shadow-xl hover:-translate-y-1 ${showScroll ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
        aria-label="Scroll back to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </footer>
  );
};

export default Footer;
