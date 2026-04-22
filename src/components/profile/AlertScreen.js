import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config';
import './Dashboard.css';

export default function AlertScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!user?.token) return;
      try {
        const uid = user?.id || user?.empId || user?.employee_id || user?.userId;
        const endpoint = uid ? API_ENDPOINTS.NOTIFICATIONS_BY_USER(uid) : API_ENDPOINTS.ALERTS;
        
        const res = await fetch(endpoint, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
          setAlerts(await res.json());
        }
      } catch (err) {
        console.error('Alert fetch error:', err);
      }
    };
    fetchAlerts();
  }, [user]);
  return (
    <div className="hr-dashboard-container">
      <AppHeader />
      
      <main className="dashboard-content" style={{paddingBottom: '100px', maxWidth: '800px', margin: '0 auto'}}>
        <header className="section-header" style={{ marginBottom: '40px' }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <button 
              onClick={() => navigate(-1)} 
              className="btn-outline"
              style={{ padding: '8px 12px' }}
            >
              ← Back
            </button>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--secondary)' }}>System Alerts</h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Real-time updates, warnings, and notifications.</p>
            </div>
          </div>
          <button className="btn-outline">Mark all as read</button>
        </header>

        <section className="dashboard-section animate-fade-in" style={{padding: 0, background: 'transparent', boxShadow: 'none', border: 'none'}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            {alerts.length > 0 ? (
              alerts.map(alert => (
                <div key={alert.id} className="team-card" style={{
                  display: 'flex', gap: '20px', alignItems: 'flex-start',
                  position: 'relative', overflow: 'hidden', cursor: 'pointer'
                }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
                    background: alert.type === 'critical' ? 'var(--error)' : alert.type === 'warning' ? 'var(--warning)' : alert.type === 'success' ? 'var(--accent)' : 'var(--primary)'
                  }}></div>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '16px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                    background: alert.type === 'critical' ? '#fef2f2' : alert.type === 'warning' ? '#fffbeb' : alert.type === 'success' ? '#ecfdf5' : 'var(--primary-light)',
                  }}>
                    {alert.type === 'critical' ? '🚨' : alert.type === 'warning' ? '⚠️' : alert.type === 'success' ? '✅' : 'ℹ️'}
                  </div>
                  <div style={{flex: 1}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                      <h3 style={{fontSize: '16px', fontWeight: '800', color: 'var(--secondary)', margin: 0}}>{alert.title}</h3>
                      <span style={{fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)'}}>{alert.time}</span>
                    </div>
                    <p style={{fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0}}>{alert.desc}</p>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '60px 20px', background: 'white', borderRadius: 'var(--radius-lg)', border: '2px dashed var(--border)', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🧘‍♂️</div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--secondary)', marginBottom: '8px' }}>All Clear!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>You've caught up with all system signals. No new alerts at this time.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <AppFooter />
    </div>
  );
}
