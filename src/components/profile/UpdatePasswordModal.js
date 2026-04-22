import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Key } from 'lucide-react';
import { BASE_URL } from '../../config';

export default function UpdatePasswordModal({ isOpen, onClose, userEmail }) {
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleUpdate = async () => {
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/profile/update-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: userEmail,
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        }, 2000);
      } else {
        setError(data.error || 'Failed to update password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            style={{
              backgroundColor: 'white',
              width: '100%',
              maxWidth: '440px',
              borderRadius: '40px',
              padding: '40px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              position: 'relative',
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '30px',
                right: '30px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={24} />
            </button>

            <div style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontSize: '28px',
                fontWeight: '900',
                color: '#0B1E3F',
                margin: 0,
                textAlign: 'left'
              }}>Update Password</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '900',
                  color: '#64748b',
                  marginBottom: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px'
                }}>Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwords.currentPassword}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '18px 24px',
                    borderRadius: '20px',
                    border: '1.5px solid #eef2f6',
                    background: '#f8fafc',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#0B1E3F',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '900',
                  color: '#64748b',
                  marginBottom: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px'
                }}>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '18px 24px',
                    borderRadius: '20px',
                    border: '1.5px solid #eef2f6',
                    background: '#f8fafc',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#0B1E3F',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '900',
                  color: '#64748b',
                  marginBottom: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px'
                }}>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '18px 24px',
                    borderRadius: '20px',
                    border: '1.5px solid #eef2f6',
                    background: '#f8fafc',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#0B1E3F',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s'
                  }}
                />
              </div>

              {error && (
                <p style={{ color: '#ef4444', fontSize: '14px', fontWeight: '700', margin: 0, textAlign: 'center' }}>
                  {error}
                </p>
              )}

              {success && (
                <p style={{ color: '#10b981', fontSize: '14px', fontWeight: '700', margin: 0, textAlign: 'center' }}>
                  Password updated successfully!
                </p>
              )}

              <button
                onClick={handleUpdate}
                disabled={loading || success}
                style={{
                  width: '100%',
                  padding: '20px',
                  borderRadius: '20px',
                  border: 'none',
                  background: '#315A9E',
                  color: 'white',
                  fontWeight: '900',
                  fontSize: '16px',
                  cursor: (loading || success) ? 'not-allowed' : 'pointer',
                  marginTop: '10px',
                  boxShadow: '0 10px 20px rgba(49, 90, 158, 0.2)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  transition: 'all 0.2s'
                }}
              >
                {loading ? 'Processing...' : 'Establish New Passkey'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
