import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS, BASE_URL } from '../../config';
import { filterActiveEmployees } from '../../utils/employeeUtils';
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

      // Fetch teams and users in parallel
      const [teamsRes, usersRes] = await Promise.all([
        fetch(API_ENDPOINTS.TEAMS, { headers: { 'Authorization': `Bearer ${user.token}` } }),
        fetch(API_ENDPOINTS.USERS, { headers: { 'Authorization': `Bearer ${user.token}` } })
      ]);

      const teamsData = teamsRes.ok ? await teamsRes.json() : [];
      const usersData = usersRes.ok ? await usersRes.json() : [];

      const allTeams = Array.isArray(teamsData) ? teamsData : [];
      const parsedUsers = Array.isArray(usersData) ? usersData : (usersData.users || usersData.data || []);
      const activeUsers = filterActiveEmployees(parsedUsers);

      // Build a role map keyed by lowercase name
      const roleMap = {};
      activeUsers.forEach(u => {
        if (u.name) roleMap[u.name.toLowerCase().trim()] = u.role;
      });
      const activeUserNames = new Set(activeUsers.map(u => String(u.name || '').toLowerCase().trim()));

      // Enrich each team with its active members
      const enrichedTeams = allTeams.map(team => {
        const rawMembers = Array.isArray(team.membersList)
          ? team.membersList
          : Array.isArray(team.members)
            ? (typeof team.members === 'number' ? [] : team.members)
            : [];

        const activeMembers = rawMembers.filter(m =>
          activeUserNames.has(String(m.name || '').toLowerCase().trim())
        );

        const enrichedMembers = activeMembers.map(m => ({
          ...m,
          role: roleMap[String(m.name || '').toLowerCase().trim()] || m.role || 'Member'
        }));

        return {
          ...team,
          enrichedMembers,
          memberCount: enrichedMembers.length
        };
      });

      setTeams(enrichedTeams);
    } catch (err) {
      console.error('Fetch teams error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarSrc = (member) => {
    const pic = member.profile_pic || member.profile_picture;
    if (!pic) return null;
    if (pic.startsWith('http') || pic.startsWith('data:')) return pic;
    return `${BASE_URL}${pic.startsWith('/') ? '' : '/'}${pic}`;
  };

  return (
    <div className="hr-dashboard-container" style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />

      <style>{`
        .team-card { transition: all 0.2s ease-in-out; }
        .team-card:hover { box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.15) !important; transform: translateY(-4px); }
        .member-chip { transition: all 0.15s ease; }
        .member-chip:hover { transform: scale(1.03); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
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
            gridTemplateColumns: `repeat(auto-fit, minmax(${winWidth < 480 ? '280px' : '340px'}, 1fr))`,
            gap: winWidth < 480 ? '16px' : '24px',
            justifyContent: 'center'
          }}>
            {teams.map((team, idx) => {
              const leader = team.enrichedMembers?.find(m => /lead|manager|head/i.test(m.role));
              const nonLeaders = team.enrichedMembers?.filter(m => !(/lead|manager|head/i.test(m.role))) || [];

              return (
                <div
                  key={idx}
                  className="team-card animate-fade-in"
                  style={{
                    background: 'white',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    border: '1.5px solid #cbd5e1',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    animationDelay: `${idx * 0.05}s`,
                    cursor: 'default'
                  }}
                >
                  {/* Top Section - Team Name */}
                  <div style={{ padding: '20px 24px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{
                      fontSize: '20px',
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
                    padding: winWidth < 480 ? '10px 16px' : '14px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid #e0f2fe',
                    borderBottom: '1px solid #e0f2fe',
                    minHeight: winWidth < 480 ? '48px' : '58px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{
                          width: winWidth < 480 ? '32px' : '38px',
                          height: winWidth < 480 ? '32px' : '38px',
                          borderRadius: '10px', background: '#3863a8',
                          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: winWidth < 480 ? '14px' : '16px', fontWeight: '900',
                          overflow: 'hidden'
                        }}>
                          {leader && getAvatarSrc(leader) ? (
                            <img src={getAvatarSrc(leader)} alt="Leader" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            (leader?.name || team.lead || 'U').charAt(0).toUpperCase()
                          )}
                        </div>
                        <div style={{
                          position: 'absolute', top: '-4px', right: '-4px', width: '12px', height: '12px',
                          background: '#f59e0b', borderRadius: '4px', transform: 'rotate(45deg)', border: '2px solid #f0f9ff'
                        }}></div>
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <h4 style={{ margin: 0, fontSize: winWidth < 480 ? '13px' : '14px', fontWeight: '800', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {leader?.name || team.lead || 'Unassigned'}
                        </h4>
                        <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>Leader</p>
                      </div>
                    </div>
                    <div style={{ background: '#e0f2fe', borderRadius: '50px', padding: '4px 10px', fontSize: '11px', fontWeight: '800', color: '#0369a1', flexShrink: 0, marginLeft: '8px' }}>
                      {team.memberCount || 0} Members
                    </div>
                  </div>

                  {/* Members Section */}
                  <div style={{ padding: winWidth < 480 ? '14px 16px' : '16px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {nonLeaders.length > 0 ? (
                      <>
                        <div style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Team Members</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {nonLeaders.map((member, i) => {
                            const avatarSrc = getAvatarSrc(member);
                            return (
                              <div
                                key={i}
                                className="member-chip"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  background: '#f8fafc',
                                  borderRadius: '12px',
                                  padding: '8px 12px',
                                  border: '1px solid #f1f5f9'
                                }}
                              >
                                <div style={{
                                  width: '30px', height: '30px', borderRadius: '8px',
                                  background: '#e0e7ff', color: '#3730a3',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontWeight: '800', fontSize: '13px', overflow: 'hidden', flexShrink: 0
                                }}>
                                  {avatarSrc ? (
                                    <img src={avatarSrc} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    member.name?.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div style={{ overflow: 'hidden', flex: 1 }}>
                                  <div style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name}</div>
                                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.role}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '10px 0', fontStyle: 'italic' }}>No other members</div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
