import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Cake, Gift, Heart, User, RefreshCcw, CheckCircle2 } from 'lucide-react';

const ALL_BIRTHDAYS = [
  { id: 1, name: 'Anish V N', date: 'Mar 25', status: 'Upcoming' },
  { id: 2, name: 'Sarah Jenkins', date: 'Mar 29', status: 'Upcoming' },
  { id: 3, name: 'John Doe', date: 'Apr 02', status: 'Upcoming' },
  { id: 4, name: 'Sahana N V', date: 'Jan 12', status: 'Passed' },
  { id: 5, name: 'Alex Rivera', date: 'Feb 14', status: 'Passed' },
  { id: 6, name: 'Michael Chen', date: 'May 20', status: 'Upcoming' }
];

export default function BirthdayListScreen() {
  const { user } = useAuth();

  const styles = {
    container: { backgroundColor: 'var(--bg)', minHeight: '100vh', padding: '100px 20px 40px' },
    card: { maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', padding: '40px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' },
    header: { textAlign: 'center', marginBottom: '50px' },
    title: { fontSize: '32px', fontWeight: '900', color: 'var(--secondary)', letterSpacing: '-1px' },
    sub: { fontSize: '15px', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '10px' },

    syncBadge: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '30px', color: 'var(--primary)', fontSize: '12px', fontWeight: '900', letterSpacing: '1px' },

    list: { display: 'flex', flexDirection: 'column', gap: '15px' },
    item: (status) => ({ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', borderRadius: 'var(--radius-lg)', backgroundColor: status === 'Upcoming' ? 'var(--primary-light)' : 'var(--bg)', border: status === 'Upcoming' ? '2px solid var(--primary)' : '1px solid var(--border)', opacity: status === 'Passed' ? 0.6 : 1, transition: '0.2s', boxShadow: 'var(--shadow-sm)' }),
    avatar: (status) => ({ width: '60px', height: '60px', borderRadius: '18px', backgroundColor: status === 'Upcoming' ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '24px' }),
    name: { fontSize: '18px', fontWeight: '900', color: 'var(--secondary)' },
    date: { fontSize: '14px', fontWeight: '700', color: 'var(--primary)', marginTop: '4px' },
    statusBadge: (status) => ({ padding: '6px 14px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', marginLeft: 'auto', backgroundColor: status === 'Upcoming' ? 'var(--primary)' : 'var(--text-muted)', color: 'white' })
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.syncBadge}><RefreshCcw size={16} /> DATA SYNCED WITH EMPLOYEE PROFILES</div>
          <Cake size={50} color="var(--primary)" style={{ marginBottom: '15px' }} />
          <h1 style={styles.title}>Workforce Birthdays</h1>
          <div style={styles.sub}>Automatic Identity Synchronization Active</div>
        </div>

        <div style={styles.list}>
          {/* Dynamic User Profile Birthday Simulation */}
          <div style={{ ...styles.item('Upcoming'), border: '3px solid var(--primary)', boxShadow: 'var(--shadow-lg)' }}>
            <div style={styles.avatar('Upcoming')}>{user?.name ? user.name[0] : 'U'}</div>
            <div>
              <div style={styles.name}>{user?.name} (Your Profile)</div>
              <div style={styles.date}>Today! Mar 25 🔥</div>
            </div>
            <div style={{ ...styles.statusBadge('Upcoming'), backgroundColor: 'var(--primary)', color: 'white' }}>ITS YOUR DAY!</div>
          </div>

          {ALL_BIRTHDAYS.map(person => (
            <div key={person.id} style={styles.item(person.status)}>
              <div style={styles.avatar(person.status)}>{person.name[0]}</div>
              <div>
                <div style={styles.name}>{person.name}</div>
                <div style={styles.date}>{person.date} {person.status === 'Upcoming' ? '⏳' : '✅'}</div>
              </div>
              <div style={styles.statusBadge(person.status)}>{person.status.toUpperCase()}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '50px', padding: '30px', backgroundColor: '#f0fdf4', borderRadius: 'var(--radius-lg)', border: '1px solid #bcf0da', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
          <CheckCircle2 color="var(--accent)" size={24} />
          <div style={{ fontWeight: '800', fontSize: '16px', color: 'var(--secondary)' }}>Profile-Driven Birthday Bot is Active</div>
        </div>
      </div>
    </div>
  );
}
