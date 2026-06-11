import React, { useState, useEffect } from 'react';
import { Search, MapPin, Building2, ShieldCheck, CalendarDays } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import api, { cachedGet } from '../../services/api';

export default function ParticipatingUniversities() {
 const [universities, setUniversities] = useState([]);
 const [searchQuery, setSearchQuery] = useState('');
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(false);

 const [debouncedSearch, setDebouncedSearch] = useState('');

 useEffect(() => {
 const handler = setTimeout(() => {
 setDebouncedSearch(searchQuery);
 }, 300);
 return () => clearTimeout(handler);
 }, [searchQuery]);

 useEffect(() => {
 const fetchUniversities = async () => {
 setLoading(true);
 setError(false);
 try {
 const response = await api.get('/public/universities', {
 params: { search: debouncedSearch }
 });
 setUniversities(response.data.data.data || []);
 } catch (err) {
 console.warn('Error fetching /public/universities', err);
 setError(true);
 } finally {
 setLoading(false);
 }
 };

 fetchUniversities();
 }, [debouncedSearch]);

 const filteredUniversities = universities; // Filtering is now done on the backend

 const formatDate = (dateString) => {
 if (!dateString) return 'N/A';
 const date = new Date(dateString);
 const day = String(date.getDate()).padStart(2, '0');
 const month = String(date.getMonth() + 1).padStart(2, '0');
 const year = date.getFullYear();
 return `${day}/${month}/${year}`;
 };

 return (
 <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
 <PublicNavbar />
 
 <main className="flex-grow py-16 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto w-full">
 <div className="text-center mb-16">
 <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl mb-6">
 Participating Universities
 </h1>
 <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
 Universities registered and verified on EduAuth Registry.
 </p>
 </div>

 <div className="max-w-xl mx-auto mb-12 relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <Search className="h-5 w-5 text-gray-400" />
 </div>
 <input
 type="text"
 className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-[var(--bg-surface)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition shadow-sm"
 placeholder="Search universities by name..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>

 {loading ? (
 <div className="flex justify-center items-center py-12">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
 </div>
 ) : error || filteredUniversities.length === 0 ? (
 <div className="text-center py-12 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] shadow-sm">
 <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No participating universities found.</h3>
 <p className="text-[var(--text-muted)] ">
 {error ? "The registry is currently updating its public endpoint." : "Try adjusting your search criteria."}
 </p>
 </div>
 ) : (
 <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
 {filteredUniversities.map((uni) => (
 <div key={uni.id} className="group flex flex-col h-full bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
 <div className="p-6 sm:p-8 flex-grow flex flex-col">
 <div className="flex items-start justify-between gap-4 mb-6">
 <div className="h-12 w-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
 <Building2 className="h-6 w-6 text-primary-600 dark:text-primary-400" />
 </div>
 <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
 <ShieldCheck className="h-3.5 w-3.5" />
 Verified
 </span>
 </div>
 <h3 className="text-xl font-bold text-[var(--text-primary)] leading-tight mb-4 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
 {uni.name}
 </h3>
 <div className="flex flex-col gap-3 mt-auto pt-6 border-t border-[var(--border)]">
 {uni.city && (
 <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
 <MapPin className="h-4 w-4 opacity-70" />
 {uni.city}
 </div>
 )}
 <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
 <CalendarDays className="h-4 w-4 opacity-70" />
 Joined {formatDate(uni.created_at)}
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </main>

 <Footer />
 </div>
 );
}
