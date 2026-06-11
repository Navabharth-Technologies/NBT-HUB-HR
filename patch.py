import sys

# Read the file
with open('src/components/profile/ServiceCertificateUserScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace imports
old_imports = '''import {
    ArrowLeft, FileText, CheckCircle, Clock,
    Download, Plus, Search, Filter, AlertCircle, X, XCircle,
    ExternalLink, Calendar, Info, Package, ShieldCheck, Sparkles
} from 'lucide-react';'''

new_imports = '''import {
    ArrowLeft, FileText, CheckCircle, Clock,
    Download, Plus, Search, Filter, AlertCircle, X, XCircle,
    ExternalLink, Calendar, Info, Package, ShieldCheck, Sparkles,
    Send, Lock, Unlock, Monitor, Mouse, Keyboard, Smartphone, Headphones, Camera, Tablet, HardDrive, Book
} from 'lucide-react';'''
content = content.replace(old_imports, new_imports)

# Replace state
old_state = '''    const [popupMessage, setPopupMessage] = useState('');

    useEffect(() => {'''

new_state = '''    const [popupMessage, setPopupMessage] = useState('');
    const [activeTab, setActiveTab] = useState('submit');
    const [formData, setFormData] = useState({
        laptopBrand: '',
        serialNumber: '',
        mouse: false,
        keyboard: false,
        stand: false,
        mobile: false,
        earphones: false,
        camera: false,
        tablet: false,
        pendrive: false,
        notepad: false
    });

    useEffect(() => {'''
content = content.replace(old_state, new_state)

# Now, we need to replace the entire <header> and <section> with the new UI.
# Find the start of <header> and end of </section>
start_idx = content.find('<header style={{')
end_idx = content.find('</section>') + len('</section>')

if start_idx != -1 and end_idx != -1:
    old_main_content = content[start_idx:end_idx]

    # Reconstruct the section parts to not lose the old map code
    # We will just inject our new UI before it and wrap the old section in activeTab === 'history'

    old_section_only_start = old_main_content.find('<!-- Section: Active & History Requests -->')
    if old_section_only_start == -1:
        old_section_only_start = old_main_content.find('<section style={{')

    old_section = old_main_content[old_section_only_start:]

    new_ui = '''<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <ArrowLeft size={18} color="#64748b" />
                    </button>
                    <div>
                         <h1 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Experience Letter</h1>
                         <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0', fontWeight: '500' }}>Request / Review service certificate</p>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    gap: winWidth < 768 ? '4px' : '8px',
                    background: '#d1d9e0',
                    padding: '6px',
                    borderRadius: '14px',
                    width: winWidth < 768 ? '100%' : 'fit-content',
                    marginBottom: '40px',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    WebkitOverflowScrolling: 'touch',
                    msOverflowStyle: 'none'
                }}>
                    <button
                        onClick={() => setActiveTab('submit')}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            padding: winWidth < 768 ? '10px 10px' : '10px 24px', borderRadius: '10px', border: 'none',
                            cursor: 'pointer', fontSize: winWidth < 768 ? '12px' : '14px', fontWeight: '800', transition: '0.3s',
                            background: activeTab === 'submit' ? 'white' : 'transparent',
                            color: activeTab === 'submit' ? '#0f172a' : '#64748b',
                            boxShadow: activeTab === 'submit' ? '0 4px 6px rgba(0,0,0,0.05)' : 'none',
                            flex: winWidth < 768 ? 1 : 'none', whiteSpace: 'nowrap', minWidth: winWidth < 768 ? '140px' : 'auto'
                        }}
                    >
                        <Send size={16} /> Apply service certificate
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            padding: winWidth < 768 ? '10px 10px' : '10px 24px', borderRadius: '10px', border: 'none',
                            cursor: 'pointer', fontSize: winWidth < 768 ? '12px' : '14px', fontWeight: '800', transition: '0.3s',
                            background: activeTab === 'history' ? 'white' : 'transparent',
                            color: activeTab === 'history' ? '#0f172a' : '#64748b',
                            boxShadow: activeTab === 'history' ? '0 4px 6px rgba(0,0,0,0.05)' : 'none',
                            flex: winWidth < 768 ? 1 : 'none', whiteSpace: 'nowrap', minWidth: winWidth < 768 ? '140px' : 'auto'
                        }}
                    >
                        <Clock size={16} /> History of Service certificate requests
                    </button>
                </div>

                {activeTab === 'submit' ? (
                     <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: winWidth < 1024 ? '1fr' : '2fr 1fr', gap: '30px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            <div style={{ background: 'white', borderRadius: '24px', padding: '30px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '25px' }}>
                                    <FileText size={20} color="#64748b" />
                                    <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Service Certificate Application</h2>
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#1e293b', marginBottom: '8px' }}>Purpose of request <span style={{color: '#ef4444'}}>*</span></label>
                                    <select 
                                        value={purpose} onChange={(e) => setPurpose(e.target.value)}
                                        style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1.5px solid #cbd5e1', background: '#f8fafc', outline: 'none', fontWeight: '700', color: '#0f172a', appearance: 'none', cursor: 'pointer' }}
                                    >
                                        <option value="" disabled>Select Purpose</option>
                                        <option value="Visa Processing">Visa Processing</option>
                                        <option value="Further Education">Further Education</option>
                                        <option value="Loan Application">Loan Application</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: winWidth < 600 ? '1fr' : '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>JOB TITLE</label>
                                        <div style={{ background: '#eef2ff', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: '800', color: '#312e81', border: '1px solid #e0e7ff' }}>
                                            {user?.designation || 'Junior Software Engineer'}
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>EMPLOYEE ID</label>
                                        <div style={{ background: '#f0fdf4', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: '800', color: '#166534', border: '1px solid #dcfce7' }}>
                                            {user?.employee_id || user?.id || '202351'}
                                        </div>
                                    </div>
                                </div>
                                <button disabled style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: '#cbd5e1', color: 'white', fontWeight: '800', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'not-allowed', marginBottom: '15px' }}>
                                    <Lock size={16} /> Declare Assets to Unlock
                                </button>
                                <div style={{ background: '#fffbeb', padding: '12px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', color: '#d97706', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AlertCircle size={16} /> Once approved HR manager will process within 1-2 business days
                                </div>
                            </div>
                            
                            <div style={{ background: 'white', borderRadius: '24px', padding: '30px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                                    <Unlock size={20} color="#3b82f6" />
                                    <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Professional Asset Declaration</h2>
                                </div>
                                <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '25px' }}>
                                    Declare details of any company assets provided to you for your work remote setup.
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: winWidth < 600 ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#1e293b', marginBottom: '8px' }}>Laptop Details (Brand) <span style={{color: '#ef4444'}}>*</span></label>
                                        <input 
                                            placeholder="e.g. Macbook Pro 14, Windows HP..." 
                                            value={formData.laptopBrand} onChange={e => setFormData({...formData, laptopBrand: e.target.value})}
                                            style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1.5px solid #cbd5e1', outline: 'none', fontWeight: '600', fontSize: '13px', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#1e293b', marginBottom: '8px' }}>Serial Number <span style={{color: '#ef4444'}}>*</span></label>
                                        <input 
                                            placeholder="e.g. MXR293L23" 
                                            value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})}
                                            style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1.5px solid #cbd5e1', outline: 'none', fontWeight: '600', fontSize: '13px', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                </div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#1e293b', marginBottom: '15px' }}>
                                    <CheckCircle size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px', color: '#3b82f6' }} /> Hardware Peripherals Verified
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginBottom: '30px' }}>
                                    {[
                                        { id: 'mouse', label: 'Optical Mouse', icon: <Mouse size={16} /> },
                                        { id: 'keyboard', label: 'External Keyboard', icon: <Keyboard size={16} /> },
                                        { id: 'stand', label: 'Laptop Stand', icon: <Monitor size={16} /> },
                                        { id: 'mobile', label: 'Company Mobile', icon: <Smartphone size={16} /> },
                                        { id: 'earphones', label: 'Earphones', icon: <Headphones size={16} /> },
                                        { id: 'camera', label: 'External Camera', icon: <Camera size={16} /> },
                                        { id: 'tablet', label: 'Tablet', icon: <Tablet size={16} /> },
                                        { id: 'pendrive', label: 'Pendrive / Storage', icon: <HardDrive size={16} /> },
                                        { id: 'notepad', label: 'Ref Pad / Notebook', icon: <Book size={16} /> },
                                    ].map(item => (
                                        <button 
                                            key={item.id}
                                            onClick={() => setFormData({...formData, [item.id]: !formData[item.id]})}
                                            style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                padding: '12px 10px', borderRadius: '14px', border: formData[item.id] ? '1.5px solid #10b981' : '1.5px solid #e2e8f0',
                                                background: formData[item.id] ? '#ecfdf5' : 'white', color: formData[item.id] ? '#059669' : '#64748b',
                                                fontWeight: '700', fontSize: '11px', cursor: 'pointer', transition: '0.2s', textAlign: 'center'
                                            }}
                                        >
                                            {item.icon}
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                                <button 
                                    onClick={handleCreateRequest}
                                    disabled={submitting}
                                    style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: '#10b981', color: 'white', fontWeight: '900', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.2)', opacity: submitting ? 0.7 : 1 }}
                                >
                                    <ShieldCheck size={18} /> {submitting ? 'Processing...' : 'Finalize Hardware Declaration'}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            <div style={{ background: 'white', borderRadius: '24px', padding: '25px', border: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
                                    <div style={{ background: '#ecfdf5', padding: '8px', borderRadius: '10px' }}>
                                        <ShieldCheck size={18} color="#10b981" />
                                    </div>
                                    <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Guidelines</h3>
                                </div>
                                <ul style={{ paddingLeft: '20px', margin: 0, color: '#475569', fontSize: '13px', fontWeight: '500', lineHeight: '1.7' }}>
                                    <li style={{ marginBottom: '10px' }}>Network connectivity from HR working apps.</li>
                                    <li style={{ marginBottom: '10px' }}>Tech hardware to be stored in clean, dry spaces.</li>
                                    <li style={{ marginBottom: '10px' }}>Remote tracking apps installed to experience effects.</li>
                                    <li>All hardware should be returned in 1-2 months.</li>
                                </ul>
                            </div>
                            
                            <div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
                                    <Clock size={18} color="#64748b" />
                                    <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Request History</h3>
                                </div>
                                {requests.filter(r => r.employee_id === user?.employee_id || r.employee_id === user?.id).length === 0 ? (
                                    <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '40px 20px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                                        <FileText size={32} color="#cbd5e1" style={{ margin: '0 auto 10px' }} />
                                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#64748b', marginBottom: '4px' }}>No requests yet</div>
                                        <div style={{ fontSize: '12px', fontWeight: '500', color: '#94a3b8' }}>Your certificate applications will appear here</div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {requests.filter(r => r.employee_id === user?.employee_id || r.employee_id === user?.id).slice(0,3).map(r => (
                                            <div key={r.id} style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>{r.purpose || 'Service Certificate'}</div>
                                                    <div style={{ fontSize: '11px', fontWeight: '500', color: '#94a3b8', marginTop: '4px' }}>{new Date(r.created_at).toLocaleDateString()}</div>
                                                </div>
                                                <div style={{ fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '8px', background: r.status === 'Approved' ? '#f0fdf4' : (r.status === 'Rejected' ? '#fef2f2' : '#fffbeb'), color: r.status === 'Approved' ? '#16a34a' : (r.status === 'Rejected' ? '#dc2626' : '#d97706') }}>
                                                    {r.status || 'Pending'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                     </div>
                ) : (
                    ''' + old_section + '''
                )}'''

    new_content = content[:start_idx] + new_ui + content[end_idx:]

    with open('src/components/profile/ServiceCertificateUserScreen.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Done")
else:
    print("Failed to find boundaries")
