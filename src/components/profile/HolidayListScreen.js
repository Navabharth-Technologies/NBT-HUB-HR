import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Globe, MapPin, Search, ChevronRight, FileSpreadsheet, Upload, CheckCircle2, ShieldAlert } from 'lucide-react';

const ALL_HOLIDAYS = [
  { id: 1, name: "New Year's Day", date: 'Jan 01', status: 'Passed' },
  { id: 2, name: 'Republic Day', date: 'Jan 26', status: 'Passed' },
  { id: 3, name: 'Holi', date: 'Mar 04', status: 'Passed' },
  { id: 4, name: 'Ugadi', date: 'Mar 19', status: 'Passed' },
  { id: 5, name: 'Id-ul-Fitr', date: 'Mar 21', status: 'Passed' },
  { id: 6, name: 'Ram Navami', date: 'Mar 26', status: 'Upcoming' },
  { id: 7, name: 'Mahavir Jayanti', date: 'Mar 31', status: 'Upcoming' },
  { id: 8, name: 'Good Friday', date: 'Apr 03', status: 'Upcoming' },
  { id: 9, name: 'Buddha Purnima', date: 'May 01', status: 'Upcoming' },
  { id: 10, name: 'Id-ul-Zuha (Bakri Id)', date: 'May 27', status: 'Upcoming' },
  { id: 11, name: 'Muharram', date: 'Jun 26', status: 'Upcoming' },
  { id: 12, name: 'Independence Day', date: 'Aug 15', status: 'Upcoming' },
  { id: 13, name: "Prophet Mohammad's Birthday", date: 'Aug 26', status: 'Upcoming' },
  { id: 14, name: 'Janmashtami', date: 'Sep 04', status: 'Upcoming' },
  { id: 15, name: "Mahatma Gandhi's Birthday", date: 'Oct 02', status: 'Upcoming' },
  { id: 16, name: 'Dussehra', date: 'Oct 20', status: 'Upcoming' },
  { id: 17, name: 'Diwali', date: 'Nov 08', status: 'Upcoming' },
  { id: 18, name: "Guru Nanak's Birthday", date: 'Nov 24', status: 'Upcoming' },
  { id: 19, name: 'Christmas Day', date: 'Dec 25', status: 'Upcoming' }
];

export default function HolidayListScreen() {
  const { user } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  
  const isManager = ['hr', 'superadmin', 'teamleader'].includes(user?.role);

  const styles = {
    container: { backgroundColor: 'var(--bg)', minHeight: '100vh', padding: '100px 20px 40px' },
    card: { maxWidth: '1000px', margin: '0 auto', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', padding: '40px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' },
    header: { textAlign: 'center', marginBottom: '50px' },
    title: { fontSize: '32px', fontWeight: '900', color: 'var(--secondary)', letterSpacing: '-1px' },
    sub: { fontSize: '15px', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '10px' },

    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' },
    item: (status) => ({ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '15px', 
      padding: '24px', 
      borderRadius: 'var(--radius-lg)', 
      backgroundColor: status === 'Upcoming' ? 'var(--primary-light)' : 'var(--bg)', 
      border: status === 'Upcoming' ? '1px solid var(--border)' : '1px solid var(--border)',
      opacity: status === 'Passed' ? 0.6 : 1,
      transition: '0.2s',
      boxShadow: 'var(--shadow-sm)'
    }),
    iconCover: (status) => ({ width: '50px', height: '50px', borderRadius: '15px', backgroundColor: status === 'Upcoming' ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }),
    name: { fontSize: '18px', fontWeight: '900', color: 'var(--secondary)' },
    date: { fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', marginTop: '4px' },
    statusIndicator: (status) => ({ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', padding: '6px 14px', borderRadius: '10px', display: 'inline-block', backgroundColor: status === 'Upcoming' ? 'var(--primary)' : 'var(--text-muted)', color: 'white', letterSpacing: '1px' })
  };

  const handleExcelImport = () => {
    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      alert('Holidays Synchronized: Microsoft Excel dataset has been processed successfully.');
    }, 1500);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          {isManager ? (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '40px' }}>
              <button className="btn-primary" onClick={handleExcelImport} style={{ padding: '15px 30px', fontSize: '15px', borderRadius: '15px' }}>
                {isImporting ? <Upload className="animate-spin" size={20} /> : <FileSpreadsheet size={20} />}
                {isImporting ? 'Processing Sheets...' : 'Import from Excel'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '30px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>
              <ShieldAlert size={16} /> Official Calendar Monitored by HR
            </div>
          )}
          <Calendar size={50} color="var(--primary)" style={{marginBottom: '15px'}} />
          <h1 style={styles.title}>Unified Public Calendar</h1>
          <div style={styles.sub}>Official Corporate Holidays 2024</div>
        </div>

        <div style={styles.grid}>
          {ALL_HOLIDAYS.map(holiday => (
            <div key={holiday.id} style={styles.item(holiday.status)}>
              <div style={styles.iconCover(holiday.status)}><Globe size={24} /></div>
              <div>
                <div style={styles.name}>{holiday.name}</div>
                <div style={styles.date}>{holiday.date}</div>
              </div>
              <div>
                <div style={styles.statusIndicator(holiday.status)}>{holiday.status}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '50px', padding: '30px', backgroundColor: '#f0fdf4', borderRadius: 'var(--radius-lg)', border: '1px solid #bcf0da', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
           <CheckCircle2 color="var(--accent)" size={24} />
           <div style={{ fontWeight: '800', fontSize: '16px', color: 'var(--secondary)' }}>Global Calendar Synchronization Active</div>
        </div>
      </div>
    </div>
  );
}
