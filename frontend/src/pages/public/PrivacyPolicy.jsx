import React from 'react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';

export default function PrivacyPolicy() {
 const currentDate = new Date();
 const formattedDate = `${String(currentDate.getDate()).padStart(2, '0')}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${currentDate.getFullYear()}`;

 return (
 <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
 <PublicNavbar />
 
 <main className="flex-grow py-16 px-4 sm:px-6 lg:px-8 max-w-[900px] mx-auto w-full">
 <div className="bg-[var(--bg-surface)] rounded-3xl p-8 sm:p-14 shadow-sm border border-[var(--border)] hover:shadow-md transition-shadow duration-300">
 <div className="mb-14 border-b border-[var(--border)] pb-10 text-center">
 <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] mb-6">Privacy Policy</h1>
 <p className="text-sm font-medium text-[var(--text-muted)] bg-[var(--bg-base)] inline-block px-4 py-2 rounded-full">
 Last updated: {formattedDate}
 </p>
 </div>

 <div className="prose prose-blue max-w-none space-y-10">
 
 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">1. Introduction</h2>
 <p className="text-[var(--text-secondary)] leading-relaxed">
 EduAuth Registry is committed to protecting the privacy of all users. This policy explains what data we collect, how we use it, and how it is protected.
 </p>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">2. Data We Collect</h2>
 <div className="space-y-4">
 <p className="text-[var(--text-secondary)] leading-relaxed">
 <strong className="text-[var(--text-primary)]">Students:</strong> full name, email, date of birth, gender, phone, address, NID/birth certificate number (stored as a one-way cryptographic hash — the original value cannot be recovered after submission).
 </p>
 <p className="text-[var(--text-secondary)] leading-relaxed">
 <strong className="text-[var(--text-primary)]">Universities:</strong> institution name, contact email, administrator name, city, phone, website.
 </p>
 <p className="text-[var(--text-secondary)] leading-relaxed">
 <strong className="text-[var(--text-primary)]">Verifiers:</strong> organisation name, contact email, designation, purpose of verification.
 </p>
 <p className="text-[var(--text-secondary)] leading-relaxed">
 <strong className="text-[var(--text-primary)]">Usage data:</strong> login timestamps, verification logs, activity records for audit purposes.
 </p>
 </div>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">3. How We Use Your Data</h2>
 <p className="text-[var(--text-secondary)] leading-relaxed">
 To issue, store, and verify academic certificates. To facilitate access requests between students and verifiers. To send notifications about certificate events. To maintain an audit trail for security. We do not sell, share, or disclose personal data to third parties for commercial purposes.
 </p>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">4. Data Security</h2>
 <p className="text-[var(--text-secondary)] leading-relaxed">
 NID and sensitive identifiers are stored using one-way cryptographic hashing. All transmission occurs over HTTPS. Access is role-restricted — only data necessary for a role's function is accessible. Certificate serial numbers use checksum validation to prevent forgery.
 </p>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">5. Student Rights</h2>
 <p className="text-[var(--text-secondary)] leading-relaxed">
 Students can control certificate visibility. Students can approve or reject verifier access requests. Students can request a name change through the platform. Students can request withdrawal from an institution.
 </p>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">6. Data Retention</h2>
 <p className="text-[var(--text-secondary)] leading-relaxed">
 Active account data is retained while the account is active. Certificate records are retained permanently as part of the academic registry. Activity logs are retained for audit purposes.
 </p>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">7. Contact</h2>
 <p className="text-[var(--text-secondary)] leading-relaxed">
 For privacy enquiries, use the Contact Support page.
 </p>
 </section>

 </div>
 </div>
 </main>

 <Footer />
 </div>
 );
}
