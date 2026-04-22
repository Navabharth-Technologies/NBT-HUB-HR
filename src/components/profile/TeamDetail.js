import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config';
import './Dashboard.css';

export default function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [teamUpdates, setTeamUpdates] = useState([]);
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
            setTeam({
              id: found.id,
              name: found.name,
              lead: found.lead || 'Unit Lead',
              members: found.membersList || [],
              tasks: found.tasks || []
            });

            // 2. Fetch live tasks from master_tasks repository
            const tasksRes = await fetch(`${API_ENDPOINTS.TASKS}?team=${found.name}`, {
              headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (tasksRes.ok) {
              const allTasks = await tasksRes.json();
              const leadName = found.lead || (found.membersList || []).find(m => /lead|manager|head/i.test(m.role))?.name;
              const filteredTasks = allTasks.filter(t => {
                const matchesTeam = String(t.team_name || t.team || '').toLowerCase() === found.name.toLowerCase();
                const involvesLead = leadName && (
                  t.assigner_name === leadName || 
                  t.owner_name === leadName || 
                  t.assignee_name === leadName
                );
                return matchesTeam || involvesLead;
              });
              setTeamUpdates(filteredTasks);
            }
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
      <div style={{padding: '100px', textAlign: 'center', color: '#64748b'}} className="animate-pulse">Accessing Secure Unit Data...</div>
      <AppFooter />
    </div>
  );

  if (!team) return (
    <div className="hr-dashboard-container">
      <AppHeader />
      <div style={{padding: '100px', textAlign: 'center', color: '#ef4444'}}>Management Unit Not Found</div>
      <AppFooter />
    </div>
  );

  return (
    <div className="hr-dashboard-container" style={{backgroundColor: '#eaeff2', minHeight: '100vh'}}>
      <AppHeader />
      
      <main className="dashboard-content" style={{paddingBottom: '120px', maxWidth: '1400px', margin: '0 auto'}}>
        <header className="section-header" style={{
          marginBottom: '30px', 
          flexDirection: winWidth < 768 ? 'column' : 'row', 
          alignItems: winWidth < 768 ? 'flex-start' : 'center',
          gap: winWidth < 768 ? '15px' : '0'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <button 
              onClick={() => navigate('/teams')} 
              className="btn-outline" 
              style={{padding: '8px 12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', fontWeight: '700'}}
            >
              ← Back
            </button>
            <div>
              <h1 style={{fontSize: winWidth < 768 ? '24px' : '30px', fontWeight: '900', color: '#1e293b', margin: 0}}>{team.name}</h1>
              <p style={{color: '#64748b', margin: 0, fontWeight: '500'}}>Detailed performance and member analytics</p>
            </div>
          </div>
          
          <div style={{display: 'flex', gap: '10px', width: winWidth < 768 ? '100%' : 'auto'}}>
            <button className="btn-primary" style={{flex: 1, padding: '12px 24px', background: '#3863a8', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '900'}}>Download report</button>
            <button className="btn-outline" style={{padding: '12px 20px', background: 'white', borderRadius: '14px'}}>Filter</button>
          </div>
        </header>

        <div className="main-dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px', width: '100%', overflowX: 'hidden' }}>
          <section className="dashboard-section animate-fade-in" style={{ width: '100%', overflowX: 'hidden' }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2 className="section-title" style={{margin: 0}}>Team Roster</h2>
              <span style={{fontSize: '12px', fontWeight: 'bold', color: '#64748b'}}>{team.members.length} Total People</span>
            </div>

            <div style={{marginBottom: '32px'}}>
              <div style={{fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px'}}>Team Leadership</div>
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
                      <div style={{position: 'relative'}}>
                        <div style={{width: '64px', height: '64px', borderRadius: '20px', background: '#3863a8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '900'}}>
                          {leader.name.charAt(0)}
                        </div>
                        <div style={{position: 'absolute', bottom: '-5px', right: '-5px', background: '#f59e0b', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #f0f9ff', fontSize: '12px'}}>👑</div>
                      </div>
                      <div style={{flex: 1, minWidth: 0, width: '100%'}}>
                        <div style={{
                          display: 'flex', 
                          flexDirection: winWidth < 480 ? 'column' : 'row',
                          alignItems: winWidth < 480 ? 'flex-start' : 'center', 
                          gap: '8px', 
                          marginBottom: '6px',
                          flexWrap: 'wrap'
                        }}>
                          <div style={{fontWeight: '900', fontSize: winWidth < 480 ? '16px' : '18px', color: '#1e293b', wordBreak: 'break-word'}}>{leader.name}</div>
                          <span style={{padding: '3px 10px', background: '#3863a8', color: 'white', fontSize: '10px', fontWeight: '900', borderRadius: '50px', textTransform: 'uppercase'}}>TEAM LEADER</span>
                        </div>
                        <div style={{fontSize: '14px', color: '#475569', fontWeight: '700'}}>{leader.role}</div>
                        <div style={{fontSize: '12px', marginTop: '6px', color: '#10b981', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px'}}>
                          <div style={{width: '8px', height: '8px', borderRadius: '50%', background: '#10b981'}}></div>
                          OFFICIAL STATUS: ONLINE
                        </div>
                      </div>
                      <div style={{fontSize: '20px', color: '#3863a8'}}>→</div>
                    </div>
                  );
                })()
              ) : (
                <div style={{padding: '30px', textAlign: 'center', background: '#f8fafc', borderRadius: '24px', border: '1.5px dashed #e2e8f0', color: '#94a3b8'}}>No leadership assigned to this unit.</div>
              )}
            </div>

            <div>
              <div style={{fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '17px'}}>Team Members</div>
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
                      <div style={{width: winWidth < 480 ? '36px' : '42px', height: winWidth < 480 ? '36px' : '42px', borderRadius: '12px', background: '#f1f5f9', color: '#312e81', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: winWidth < 480 ? '14px' : '16px'}}>
                        {member.name.charAt(0)}
                      </div>
                      <div style={{overflow: 'hidden'}}>
                        <div style={{fontWeight: '800', fontSize: winWidth < 480 ? '13px' : '14px', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{member.name}</div>
                        <div style={{fontSize: winWidth < 480 ? '10px' : '11px', color: '#64748b', fontWeight: '600'}}>{member.role}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </section>

          <section className="dashboard-section animate-fade-in" style={{marginTop: '10px'}}>
            <h2 className="section-title">Assigned Tasks</h2>
            <div style={{marginTop: '20px'}}>
              {winWidth < 768 ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  {teamUpdates.map((task, i) => (
                    <div key={i} style={{
                      padding: '16px', 
                      background: '#f8fafc', 
                      borderRadius: '20px', 
                      border: '1px solid #f1f5f9',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'flex-start'}}>
                        <div style={{fontWeight: '800', fontSize: '14px', color: '#1e293b', flex: 1, paddingRight: '10px'}}>{task.task_name || task.name}</div>
                        <span style={{
                          padding: '3px 10px', borderRadius: '50px', fontSize: '9px', fontWeight: '900',
                          backgroundColor: (task.priority || 'Normal').toUpperCase() === 'CRITICAL' ? '#fee2e2' : '#e0f2fe',
                          color: (task.priority || 'Normal').toUpperCase() === 'CRITICAL' ? '#ef4444' : '#0369a1',
                          textTransform: 'uppercase'
                        }}>
                          {task.priority || 'Normal'}
                        </span>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <span style={{fontSize: '11px', fontWeight: '900', color: '#3863a8', background: '#eff6ff', padding: '4px 10px', borderRadius: '8px'}}>
                          {task.status || 'Pending'}
                        </span>
                        <span style={{fontSize: '11px', fontWeight: '700', color: '#64748b'}}>
                          Due: {task.deadline || 'No Deadline'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {teamUpdates.length === 0 && (
                    <div style={{padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', border: '1.5px dashed #e2e8f0', borderRadius: '20px'}}>No active tasks found.</div>
                  )}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Task Name</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Deadline</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamUpdates.map((task, i) => (
                        <tr key={i}>
                          <td style={{fontWeight: '700', fontSize: '13px', color: '#1e293b'}}>{task.task_name || task.name}</td>
                          <td>
                            <span style={{
                              padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '900',
                              backgroundColor: (task.priority || 'Normal').toUpperCase() === 'CRITICAL' ? '#fef2f2' : '#f0f9ff',
                              color: (task.priority || 'Normal').toUpperCase() === 'CRITICAL' ? '#ef4444' : '#0369a1',
                              textTransform: 'uppercase'
                            }}>
                              {task.priority || 'Normal'}
                            </span>
                          </td>
                          <td>
                            <span style={{fontSize: '11px', fontWeight: '900', color: '#3863a8', background: '#eff6ff', padding: '4px 10px', borderRadius: '8px'}}>
                              {task.status || 'Pending'}
                            </span>
                          </td>
                          <td style={{fontSize: '11px', fontWeight: '700', color: '#64748b'}}>
                            {task.deadline || 'No Deadline'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
