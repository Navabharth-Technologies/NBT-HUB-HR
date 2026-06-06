import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { HashRouter } from 'react-router-dom';
import reportWebVitals from './reportWebVitals';

// Helper: show a beautiful centered modal (pure DOM, works outside React tree)
function showSessionExpiredModal(message, onConfirm, title = "Session Expired", icon = "⚠") {
  // Remove any existing modal
  const existing = document.getElementById('__session_modal__');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = '__session_modal__';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(15, 23, 42, 0.55);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    animation: __smFadeIn__ 0.2s ease;
  `;

  overlay.innerHTML = `
    <style>
      @keyframes __smFadeIn__ { from { opacity:0; } to { opacity:1; } }
      @keyframes __smPop__    { from { opacity:0; transform:scale(0.85) translateY(16px); } to { opacity:1; transform:scale(1) translateY(0); } }
      #__session_modal__ .__sm_card__ {
        background: linear-gradient(135deg, #fff8f0 0%, #fff1e6 100%);
        border: 2px solid #fed7aa;
        border-radius: 28px;
        padding: 36px 40px 28px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 24px 64px rgba(234,88,12,0.2);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        text-align: center;
        animation: __smPop__ 0.3s cubic-bezier(0.16,1,0.3,1);
        font-family: 'Inter', 'Outfit', system-ui, sans-serif;
      }
      #__session_modal__ .__sm_icon__ {
        width: 56px; height: 56px; border-radius: 50%;
        background: linear-gradient(135deg, #f97316, #ea580c);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 8px 24px rgba(249,115,22,0.4);
        font-size: 26px; color: white;
      }
      #__session_modal__ .__sm_title__ {
        font-size: 17px; font-weight: 900; color: #9a3412; margin: 0;
      }
      #__session_modal__ .__sm_msg__ {
        font-size: 14px; font-weight: 600; color: #7c2d12;
        margin: 0; line-height: 1.6;
      }
      #__session_modal__ .__sm_btn__ {
        margin-top: 4px;
        padding: 12px 40px;
        border-radius: 50px; border: none;
        background: linear-gradient(135deg, #f97316, #ea580c);
        color: white; font-size: 14px; font-weight: 900;
        cursor: pointer; letter-spacing: 0.5px;
        box-shadow: 0 6px 20px rgba(249,115,22,0.4);
        transition: transform 0.15s, box-shadow 0.15s;
        font-family: inherit;
      }
      #__session_modal__ .__sm_btn__:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 28px rgba(249,115,22,0.5);
      }
    </style>
    <div class="__sm_card__">
      <div class="__sm_icon__">${icon}</div>
      <p class="__sm_title__">${title}</p>
      <p class="__sm_msg__">${message}</p>
      <button class="__sm_btn__" id="__session_ok_btn__">OK, Got it</button>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('__session_ok_btn__').addEventListener('click', () => {
    overlay.style.animation = 'none';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.2s';
    setTimeout(() => { overlay.remove(); if (onConfirm) onConfirm(); }, 200);
  });
}

// Helper: show a beautiful centered alert modal (pure DOM, works outside React tree)
window.alert = function (message) {
  // Remove any existing alert modal
  const existing = document.getElementById('__custom_alert_modal__');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = '__custom_alert_modal__';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    animation: __caFadeIn__ 0.2s ease;
  `;

  // Detect type of message to customize icon/title
  const msgStr = String(message || '');
  const isSuccess = msgStr.includes('successfully') || msgStr.includes('✅') || msgStr.includes('Success') || msgStr.includes('🎉') || msgStr.includes('posted') || msgStr.includes('updated') || msgStr.includes('saved');
  const isWarning = msgStr.includes('required') || msgStr.includes('select') || msgStr.includes('fill') || msgStr.includes('Warning') || msgStr.includes('attention') || msgStr.includes('already');
  
  let icon = 'ℹ️';
  let title = 'Notification';
  let primaryColor = '#3b82f6';
  let primaryBg = '#eff6ff';
  let borderColor = '#bfdbfe';

  if (isSuccess) {
    icon = '✅';
    title = 'Success';
    primaryColor = '#10b981';
    primaryBg = '#ecfdf5';
    borderColor = '#a7f3d0';
  } else if (isWarning) {
    icon = '⚠️';
    title = 'Warning';
    primaryColor = '#f59e0b';
    primaryBg = '#fffbeb';
    borderColor = '#fde68a';
  }

  overlay.innerHTML = `
    <style>
      @keyframes __caFadeIn__ { from { opacity:0; } to { opacity:1; } }
      @keyframes __caPop__    { from { opacity:0; transform:scale(0.9) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
      #__custom_alert_modal__ .__ca_card__ {
        background: white;
        border: 1px solid ${borderColor};
        border-radius: 24px;
        padding: 32px 32px 24px;
        max-width: 420px;
        width: 90%;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        text-align: center;
        animation: __caPop__ 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: 'Outfit', 'Inter', system-ui, sans-serif;
      }
      #__custom_alert_modal__ .__ca_icon__ {
        width: 52px; height: 52px; border-radius: 16px;
        background: ${primaryBg};
        display: flex; align-items: center; justify-content: center;
        font-size: 24px; color: ${primaryColor};
      }
      #__custom_alert_modal__ .__ca_title__ {
        font-size: 18px; font-weight: 900; color: #0f172a; margin: 0;
        letter-spacing: -0.3px;
        text-transform: uppercase;
      }
      #__custom_alert_modal__ .__ca_msg__ {
        font-size: 14px; font-weight: 600; color: #475569;
        margin: 0; line-height: 1.5;
        white-space: pre-wrap;
      }
      #__custom_alert_modal__ .__ca_btn__ {
        margin-top: 8px;
        padding: 12px 40px;
        border-radius: 12px; border: none;
        background: #0f172a;
        color: white; font-size: 13px; font-weight: 800;
        cursor: pointer; letter-spacing: 0.5px;
        transition: background 0.15s, transform 0.1s;
        font-family: inherit;
        text-transform: uppercase;
      }
      #__custom_alert_modal__ .__ca_btn__:hover {
        background: #1e293b;
      }
      #__custom_alert_modal__ .__ca_btn__:active {
        transform: scale(0.98);
      }
    </style>
    <div class="__ca_card__">
      <div class="__ca_icon__">${icon}</div>
      <p class="__ca_title__">${title}</p>
      <p class="__ca_msg__">${message}</p>
      <button class="__ca_btn__" id="__custom_alert_ok_btn__">OK</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const btn = document.getElementById('__custom_alert_ok_btn__');
  if (btn) btn.focus();

  const closeModal = () => {
    window.removeEventListener('keydown', handleKeyDown);
    overlay.style.animation = 'none';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.15s';
    setTimeout(() => { overlay.remove(); }, 150);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' || e.key === 'Enter') {
      e.preventDefault();
      closeModal();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  btn.addEventListener('click', closeModal);
};

// Global Security Interceptor (Fetch version of Axios Interceptor)
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  try {
    const response = await originalFetch(...args);

    // Database or Server Issue check (500-504)
    if (response.status >= 500 && response.status <= 504) {
      showSessionExpiredModal(
        "A database or server connection issue was encountered. Please try again later.",
        null,
        "Server Error",
        "⚙"
      );
      return response;
    }

    if (response.status === 401) {
      // Avoid infinite loop if already on login page
      if (window.location.hash === '#/login' || window.location.pathname === '/login') return response;

      try {
        const data = await response.clone().json();
        if (data.globalLogout) {
          // Clear storage first, then show modal
          localStorage.removeItem('token');
          localStorage.removeItem('navAuthUser');
          localStorage.removeItem('userRole');
          window.dispatchEvent(new Event('auth:logout'));
          showSessionExpiredModal(
            "Your session has expired because your password was changed on another device.",
            () => { window.location.hash = '/login'; },
            "Session Expired",
            "⚠"
          );
          return response;
        }
      } catch (e) { /* Ignore non-JSON errors */ }

      localStorage.removeItem('token');
      localStorage.removeItem('navAuthUser');
      localStorage.removeItem('userRole');
      window.dispatchEvent(new Event('auth:logout'));
      window.location.hash = '/login';
    }
    return response;
  } catch (error) {
    // Network connectivity check (fetch failure)
    if (error.name === 'TypeError' || error.message?.includes('Failed to fetch') || error.message?.includes('network')) {
      window.dispatchEvent(new Event('offline'));
      showSessionExpiredModal(
        "Please check your internet connection and try again.",
        null,
        "Network Error",
        "🔌"
      );
    }
    return Promise.reject(error);
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);

reportWebVitals();
