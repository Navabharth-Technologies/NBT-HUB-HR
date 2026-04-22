import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { FileText, ChevronLeft, TrendingUp, BarChart2, CheckCircle, PieChart } from 'lucide-react';
import './Dashboard.css';

export default function ReportScreen() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id') || '482';
  const navigate = useNavigate();

  return (
    <div className="hr-dashboard-container">
      <AppHeader />
      <main className="dashboard-content">
        <header className="section-header animate-fade-in">
           <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button 
                onClick={() => navigate(-1)} 
                className="btn-outline"
                style={{ padding: '10px' }}
              >
                <ChevronLeft size={18} />
              </button>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--secondary)' }}>Performance Report</h1>
                <p style={{ color: 'var(--text-muted)' }}>Detailed analysis for Employee ID: <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{id}</span></p>
              </div>
           </div>
        </header>

        <section className="dashboard-section animate-fade-in">
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div className="stat-card">
                 <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                    <BarChart2 size={18} color="var(--primary)" />
                    <span className="stat-label">PRODUCTION RATE</span>
                 </div>
                 <div className="stat-value" style={{ fontSize: '24px' }}>94.8%</div>
                 <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '700', marginTop: '4px' }}>+3.2% increase</div>
              </div>
              <div className="stat-card">
                 <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                    <PieChart size={18} color="#ec4899" />
                    <span className="stat-label">FEEDBACK RATIO</span>
                 </div>
                 <div className="stat-value" style={{ fontSize: '24px' }}>4.9/5.0</div>
                 <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '700', marginTop: '4px' }}>Excellent</div>
              </div>
              <div className="stat-card">
                 <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                    <CheckCircle size={18} color="var(--accent)" />
                    <span className="stat-label">TASKS DONE</span>
                 </div>
                 <div className="stat-value" style={{ fontSize: '24px' }}>152</div>
                 <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', marginTop: '4px' }}>Across 12 projects</div>
              </div>
           </div>

           <h3 className="section-title">Analysis Graph</h3>
           <div style={{ height: '200px', width: '100%', background: 'var(--bg)', borderRadius: '14px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '700' }}>
              Dynamic Performance Graph Loading...
           </div>
        </section>
      </main>
      <AppFooter />
    </div>
  );
}
