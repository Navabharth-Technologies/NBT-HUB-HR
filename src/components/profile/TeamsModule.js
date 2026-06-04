import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config';
import './Dashboard.css';

export default function TeamsModule() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [winWidth, setWinWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [user]);

  const fetchTeams = async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.TEAMS, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTeams(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Fetch teams error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hr-dashboard-container" style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />

      <style>{`
        .team-card { transition: all 0.2s ease-in-out; }
        .team-card:hover { box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.15) !important; transform: translateY(-4px); }
      `}</style>

      <main className="dashboard-content" style={{ padding: winWidth < 768 ? '100px 16px 120px' : '120px 26px 120px', width: '100%', boxSizing: 'border-box', margin: '0' }}>
        <header className="section-header" style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button
              onClick={() => navigate(-1)}
              style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
            >
              <ArrowLeft size={18} color="#64748b" />
            </button>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Total Teams</h1>
              <p style={{ color: '#64748b', margin: '4px 0 0 0', fontWeight: '500' }}></p>
            </div>
          </div>
        </header>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }} className="animate-pulse">Loading organizational structure...</div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(${winWidth < 480 ? '280px' : '320px'}, 1fr))`,
            gap: winWidth < 480 ? '16px' : '24px',
            justifyContent: 'center'
          }}>
            {teams.map((team, idx) => (
              <div
                key={idx}
                className="team-card animate-fade-in"
                onClick={() => navigate(`/teams/${encodeURIComponent(team.id)}`)}
                style={{
                  background: 'white',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  border: '1.5px solid #cbd5e1',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  animationDelay: `${idx * 0.05}s`,
                  cursor: 'pointer'
                }}
              >
                {/* Top Section */}
                <div style={{ padding: '24px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{
                    fontSize: '24px',
                    fontWeight: '900',
                    color: '#1e293b',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: '1.2',
                    width: '100%'
                  }}>
                    {team.name}
                  </h3>
                </div>

                {/* Lead Section */}
                <div style={{
                  background: '#f0f9ff',
                  padding: winWidth < 480 ? '12px 16px' : '16px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #e0f2fe',
                  borderBottom: '1px solid #e0f2fe',
                  minHeight: winWidth < 480 ? '48px' : '62px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{
                        width: winWidth < 480 ? '32px' : '42px',
                        height: winWidth < 480 ? '32px' : '42px',
                        borderRadius: '10px', background: '#3863a8',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: winWidth < 480 ? '14px' : '18px', fontWeight: '900'
                      }}>
                        {team.lead ? team.lead.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div style={{
                        position: 'absolute', top: '-4px', right: '-4px', width: '12px', height: '12px',
                        background: '#f59e0b', borderRadius: '4px', transform: 'rotate(45deg)', border: '2px solid #f0f9ff'
                      }}></div>
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <h4 style={{ margin: 0, fontSize: winWidth < 480 ? '13px' : '15px', fontWeight: '800', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.lead || 'Unassigned'}</h4>
                      <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>Leader</p>
                    </div>
                  </div>
                </div>

                {/* Body Section */}
                <div style={{ padding: winWidth < 480 ? '16px' : '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <p style={{
                    margin: winWidth < 480 ? '0 0 16px 0' : '0 0 24px 0',
                    fontSize: '13px', color: '#64748b', lineHeight: '1.6',
                    display: winWidth < 480 ? 'none' : '-webkit-box',
                    WebkitLineClamp: '3',
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: winWidth < 480 ? '0' : '62px'
                  }}>
                    {team.description || `Active operations team for ${team.name}.`}
                  </p>

                  <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                    <div style={{ flex: 1, background: '#f8fafc', padding: winWidth < 480 ? '12px' : '16px', borderRadius: '16px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: winWidth < 480 ? '18px' : '24px', fontWeight: '900', color: '#1e293b' }}>{team.members || 0}</div>
                      <div style={{ fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>MEMBERS</div>
                    </div>
                  </div>


                </div>

              </div>
            ))}
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
