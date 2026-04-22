import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config';
import './Dashboard.css';

export default function SuggestionModule() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!user?.token) return;
      try {
        const res = await fetch(API_ENDPOINTS.SUGGESTIONS, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
          setSubmissions(await res.json());
        }
      } catch (err) {
        console.error('Suggestion fetch error:', err);
      }
    };
    fetchSuggestions();
  }, [user]);
  return (
    <div className="hr-dashboard-container">
      <AppHeader />
      
      <main className="dashboard-content" style={{paddingBottom: '100px'}}>
        <header className="section-header">
          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <button 
              onClick={() => navigate(-1)} 
              className="btn-outline"
              style={{ padding: '8px 12px' }}
            >
              ← Back
            </button>
            <div>
              <h1 style={{fontSize: '24px', fontWeight: '800', color: 'var(--secondary)'}}>Innovation Hub</h1>
              <p style={{color: 'var(--text-muted)'}}>Collaborative space for internal suggestions & workflow improvements.</p>
            </div>
          </div>
          <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
            <div style={{textAlign: 'right'}}>
              <div style={{fontSize: '20px', fontWeight: '900', color: 'var(--primary)'}}>84%</div>
              <div style={{fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold'}}>PARTICIPATION RATE</div>
            </div>
          </div>
        </header>

        <section className="dashboard-section animate-fade-in">
           <h2 className="section-title">Recent Submissions</h2>
           <div style={{marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px'}}>
              {submissions.map((s, i) => (
                <div key={i} className="team-card" style={{padding: '24px', borderLeft: '4px solid var(--primary)', cursor: 'default'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px'}}>
                    <div>
                      <span style={{fontWeight: '800', color: 'var(--secondary)', fontSize: '15px'}}>{s.user}</span>
                      <span style={{fontSize: '11px', color: 'var(--text-muted)', marginLeft: '10px'}}>from <strong style={{color: 'var(--primary)'}}>{s.team}</strong></span>
                    </div>
                    <span style={{fontSize: '11px', color: 'var(--text-muted)'}}>{s.date}</span>
                  </div>
                  <p style={{fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.6', background: 'var(--bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', fontStyle: 'italic'}}>
                    "{s.content}"
                  </p>
                  <div style={{marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                      <span style={{fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)'}}>Engagement:</span>
                      <span style={{fontSize: '10px', background: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '12px', fontWeight: '800'}}>
                        {s.participation}
                      </span>
                    </div>
                    <div style={{display: 'flex', gap: '10px'}}>
                       <button className="btn-ghost" style={{ fontSize: '12px', padding: '8px 16px' }}>Archive</button>
                       <button className="btn-primary" style={{ fontSize: '12px', padding: '8px 16px' }}>Review Input</button>
                    </div>
                  </div>
                </div>
              ))}
           </div>
        </section>
      </main>
      
      <AppFooter />
    </div>
  );
}
