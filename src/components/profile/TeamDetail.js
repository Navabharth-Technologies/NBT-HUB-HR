import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS, BASE_URL } from '../../config';
import './Dashboard.css';

export default function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [winWidth, setWinWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchTeamDetail = async () => {
      if (!user?.token) return;
      try {
        setLoading(true);
        // 1. Fetch all teams to find the specific one
        const response = await fetch(API_ENDPOINTS.TEAMS, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (response.ok) {
          const allTeams = await response.json();
          const found = allTeams.find(t => t.id.toString() === id);
          if (found) {
            // Fetch users only for role resolution (Tasks removed per request)
            const usersData = await fetch(API_ENDPOINTS.USERS, { 
              headers: { 'Authorization': `Bearer ${user.token}` } 
            }).then(r => r.ok ? r.json() : []).catch(() => []);

            let roleMap = {};
            const usersList = Array.isArray(usersData) ? usersData : (usersData.users || usersData.data || []);
            usersList.forEach(u => {
              if (u.name) roleMap[u.name.toLowerCase()] = u.role;
            });

            const rawMembers = found.membersList || [];
            const enrichedMembers = rawMembers.map(m => ({
              ...m,
              role: roleMap[String(m.name || '').toLowerCase()] || m.role || 'Member'
            }));

            setTeam({
              id: found.id,
              name: found.name,
              lead: found.lead || 'Unit Lead',
              members: enrichedMembers,
              tasks: found.tasks || []
            });
          }
        }
      } catch (err) {
        console.error('Fetch team detail error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeamDetail();
  }, [id, user]);

  if (loading) return (
    <div className="hr-dashboard-container">
      <AppHeader />
      <div style={{ padding: '100px', textAlign: 'center', color: '#64748b' }} className="animate-pulse">Accessing Secure Unit Data...</div>
      <AppFooter />
    </div>
  );

  if (!team) return (
    <div className="hr-dashboard-container">
      <AppHeader />
      <div style={{ padding: '100px', textAlign: 'center', color: '#ef4444' }}>Management Unit Not Found</div>
      <AppFooter />
    </div>
  );

  return (
    <div className="hr-dashboard-container" style={{ backgroundColor: '#eaeff2', minHeight: '100vh' }}>
      <AppHeader />

      <main className="dashboard-content" style={{ paddingBottom: '120px', maxWidth: '1400px', margin: '0 auto' }}>
        <header className="section-header" style={{
          marginBottom: '30px',
          flexDirection: winWidth < 768 ? 'column' : 'row',
          alignItems: winWidth < 768 ? 'flex-start' : 'center',
          gap: winWidth < 768 ? '15px' : '0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button
              onClick={() => navigate('/teams')}
              className="btn-outline"
              style={{ padding: '8px 12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' }}
            >
              ← Back
            </button>
            <div>
              <h1 style={{ fontSize: winWidth < 768 ? '24px' : '30px', fontWeight: '900', color: '#1e293b', margin: 0 }}>{team.name}</h1>
              <p style={{ color: '#64748b', margin: 0, fontWeight: '500' }}>Detailed performance and member analytics</p>
            </div>
          </div>

          <div style={{ display: 'none', gap: '10px', width: winWidth < 768 ? '100%' : 'auto' }}>
            {/* Download report and Filter buttons removed per request */}
          </div>
        </header>

        <div className="main-dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px', width: '100%', overflowX: 'hidden' }}>
          <section className="dashboard-section animate-fade-in" style={{ width: '100%', overflowX: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="section-title" style={{ margin: 0 }}>Team Roster</h2>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>{team.members.length} Total People</span>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px' }}>Team Leadership</div>
              {team.members.find(m => /lead|manager|head/i.test(m.role)) ? (
                (() => {
                  const leader = team.members.find(m => /lead|manager|head/i.test(m.role));
                  return (
                    <div
                      onClick={() => navigate(`/reports?id=${leader.id}`)}
                      className="member-report-card"
                      style={{
                        padding: winWidth < 480 ? '20px' : '24px',
                        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                        borderRadius: '24px', border: '2px solid #bae6fd',
                        display: 'flex',
                        flexDirection: winWidth < 480 ? 'column' : 'row',
                        alignItems: winWidth < 480 ? 'flex-start' : 'center',
                        gap: '20px', cursor: 'pointer', transition: 'all 0.3s',
                        boxShadow: '0 10px 25px -5px rgba(56,99,168,0.1)'
                      }}
                    >
                      <div style={{ position: 'relative' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#3863a8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '900', overflow: 'hidden' }}>
                          {leader.profile_pic || leader.profile_picture ? (
                            <img
                              src={leader.profile_pic.startsWith('http') || leader.profile_pic.startsWith('data:') ? leader.profile_pic : `${BASE_URL}${leader.profile_pic.startsWith('/') ? '' : '/'}${leader.profile_pic}`}
                              alt="Leader"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            leader.name.charAt(0)
                          )}
                        </div>
                        <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: '#f59e0b', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #f0f9ff', fontSize: '12px' }}>👑</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
                        <div style={{
                          display: 'flex',
                          flexDirection: winWidth < 480 ? 'column' : 'row',
                          alignItems: winWidth < 480 ? 'flex-start' : 'center',
                          gap: '8px',
                          marginBottom: '6px',
                          flexWrap: 'wrap'
                        }}>
                          <div style={{ fontWeight: '900', fontSize: winWidth < 480 ? '16px' : '18px', color: '#1e293b', wordBreak: 'break-word' }}>{leader.name}</div>
                          <span style={{ padding: '3px 10px', background: '#3863a8', color: 'white', fontSize: '10px', fontWeight: '900', borderRadius: '50px', textTransform: 'uppercase' }}>TEAM LEADER</span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#475569', fontWeight: '700' }}>{leader.role}</div>
                        <div style={{ fontSize: '12px', marginTop: '6px', color: '#10b981', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                          OFFICIAL STATUS: ONLINE
                        </div>
                      </div>
                      <div style={{ fontSize: '20px', color: '#3863a8' }}>→</div>
                    </div>
                  );
                })()
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', background: '#f8fafc', borderRadius: '24px', border: '1.5px dashed #e2e8f0', color: '#94a3b8' }}>No leadership assigned to this unit.</div>
              )}
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '17px' }}>Team Members</div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fit, minmax(${winWidth < 480 ? '160px' : '290px'}, 1fr))`,
                gap: winWidth < 480 ? '12px' : '20px',
                justifyContent: 'center'
              }}>
                {team.members
                  .filter(m => !(/lead|manager|head/i.test(m.role)))
                  .map((member, i) => (
                    <div
                      key={i}
                      onClick={() => navigate(`/reports?id=${member.id}`)}
                      className="member-report-card"
                      style={{
                        padding: winWidth < 480 ? '12px' : '16px',
                        background: 'white',
                        borderRadius: winWidth < 480 ? '16px' : '20px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: winWidth < 480 ? '10px' : '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <div style={{ width: winWidth < 480 ? '36px' : '42px', height: winWidth < 480 ? '36px' : '42px', borderRadius: '12px', background: '#f1f5f9', color: '#312e81', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: winWidth < 480 ? '14px' : '16px', overflow: 'hidden' }}>
                        {member.profile_pic || member.profile_picture ? (
                          <img
                            src={member.profile_pic.startsWith('http') || member.profile_pic.startsWith('data:') ? member.profile_pic : `${BASE_URL}${member.profile_pic.startsWith('/') ? '' : '/'}${member.profile_pic}`}
                            alt="Member"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          member.name.charAt(0)
                        )}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: '800', fontSize: winWidth < 480 ? '13px' : '14px', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name}</div>
                        <div style={{ fontSize: winWidth < 480 ? '10px' : '11px', color: '#64748b', fontWeight: '600' }}>{member.role}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </section>

        </div>
      </main>

      <AppFooter />
    </div>
  );
}
