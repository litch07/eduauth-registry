import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Server, GraduationCap, Building2, Search, Globe, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';

export default function SystemStatus() {
  const [lastChecked, setLastChecked] = useState('');
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState(null);
  const [error, setError] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await api.get('/public/health');
      setHealthData(response.data);
    } catch (err) {
      console.error('Health check failed', err);
      setError(true);
    } finally {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setLastChecked(`${day}/${month}/${year} ${hours}:${minutes}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const services = [
  { name: "API Server", desc: "Certificate issuance and verification API", icon: Server, id: "api" },
  { name: "Student Portal", desc: "Student dashboard and certificate access", icon: GraduationCap, id: "app" },
  { name: "University Portal", desc: "Enrollment and certificate management", icon: Building2, id: "app" },
  { name: "Verifier Portal", desc: "Student search and verification tools", icon: Search, id: "app" },
  { name: "Public Verification", desc: "QR and serial number verification", icon: Globe, id: "app" }
  ];

  const overallStatus = error ? 'offline' : (healthData?.status || 'loading');
  const apiStatus = error ? 'offline' : (healthData?.api || 'loading');
  const appStatus = error ? 'offline' : 'operational';

  const getServiceStatus = (id) => {
    if (loading) return 'loading';
    if (id === 'api') return apiStatus;
    return appStatus;
  };

  const StatusBadge = ({ status }) => {
    if (status === 'loading') {
      return (
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Checking...
        </span>
      );
    }
    if (status === 'operational') {
      return (
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-[var(--success)]/10 text-[var(--success)]">
          <span className="w-2 h-2 rounded-full bg-[var(--success)] shadow-[0_0_8px_rgba(0,0,0,0.2)] animate-pulse"></span>
          Operational
        </span>
      );
    }
    if (status === 'degraded') {
      return (
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-orange-500/10 text-orange-500">
          <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)] animate-pulse"></span>
          Degraded
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-[var(--error)]/10 text-[var(--error)]">
        <span className="w-2 h-2 rounded-full bg-[var(--error)] shadow-[0_0_8px_rgba(239,68,68,0.4)]"></span>
        Offline
      </span>
    );
  };

 return (
 <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
 <PublicNavbar />
 
 <main className="flex-grow py-16 px-4 sm:px-6 lg:px-8 max-w-[1000px] mx-auto w-full">
 <div className="text-center mb-16">
 <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl mb-6">
 System Status
 </h1>
 <p className="text-lg text-[var(--text-secondary)]">
 Current operational status of EduAuth Registry services.
 </p>
 </div>

  {/* Status Banner */}
  <div className={`rounded-3xl p-8 sm:p-12 mb-12 shadow-md text-center flex flex-col items-center transition-colors duration-500 ${
    overallStatus === 'loading' ? 'bg-gray-200 dark:bg-gray-800 shadow-none' :
    overallStatus === 'operational' ? 'bg-[var(--success)] shadow-[var(--success)]/20' :
    overallStatus === 'degraded' ? 'bg-orange-500 shadow-orange-500/20' :
    'bg-[var(--error)] shadow-[var(--error)]/20'
  }`}>
  <div className="bg-[var(--bg-surface)]/20 p-3 rounded-full mb-6">
    {overallStatus === 'loading' ? (
      <RefreshCw className="h-10 w-10 text-white animate-spin" />
    ) : overallStatus === 'operational' ? (
      <CheckCircle2 className="h-10 w-10 text-white" />
    ) : overallStatus === 'degraded' ? (
      <AlertTriangle className="h-10 w-10 text-white" />
    ) : (
      <XCircle className="h-10 w-10 text-white" />
    )}
  </div>
  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
    {overallStatus === 'loading' ? 'Checking Systems...' :
     overallStatus === 'operational' ? 'All Systems Operational' :
     overallStatus === 'degraded' ? 'Some Systems Degraded' :
     'Major System Outage'}
  </h2>
  <p className="text-[var(--text-inverse)] font-medium">Last checked: {lastChecked || '...'}</p>
  </div>

 {/* Services Table */}
 <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border)] shadow-sm overflow-hidden">
 <div className="divide-y divide-[var(--border)]">
 {services.map((service, i) => {
 const Icon = service.icon;
 return (
 <div key={i} className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--bg-base)] transition-colors duration-200">
 <div className="flex items-center gap-5">
 <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
 <Icon className="h-6 w-6 text-[var(--text-primary)]" />
 </div>
 <div>
 <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">{service.name}</h3>
 <p className="text-sm text-[var(--text-muted)]">{service.desc}</p>
 </div>
 </div>
  <div className="flex-shrink-0 mt-4 sm:mt-0">
  <StatusBadge status={getServiceStatus(service.id)} />
  </div>
 </div>
 )})}
 </div>
 </div>

 <div className="mt-8 text-center px-6">
 <p className="text-sm text-[var(--text-muted)]">
 This page reflects the current deployment status. For real-time incident updates, contact the platform administrator.
 </p>
 </div>

 </main>

 <Footer />
 </div>
 );
}
