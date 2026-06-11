import React from 'react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';

export default function TermsOfService() {
 const currentDate = new Date();
 const formattedDate = `${String(currentDate.getDate()).padStart(2, '0')}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${currentDate.getFullYear()}`;

 return (
 <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
 <PublicNavbar />
 
 <main className="flex-grow py-16 px-4 sm:px-6 lg:px-8 max-w-[900px] mx-auto w-full">
 <div className="bg-[var(--bg-surface)] rounded-3xl p-8 sm:p-14 shadow-sm border border-[var(--border)] hover:shadow-md transition-shadow duration-300">
 <div className="mb-14 border-b border-[var(--border)] pb-10 text-center">
 <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] mb-6">Terms of Service</h1>
 <p className="text-sm font-medium text-[var(--text-muted)] bg-[var(--bg-base)] inline-block px-4 py-2 rounded-full">
 Last updated: {formattedDate}
 </p>
 </div>

 <div className="prose prose-blue dark:prose-invert max-w-none space-y-10">
 
 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">1. Acceptance of Terms</h2>
 <p className="text-[var(--text-secondary)] leading-relaxed">
 By registering on EduAuth Registry, you agree to these terms. If you do not agree, do not use the platform.
 </p>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">2. User Responsibilities</h2>
 <div className="space-y-4">
 <p className="text-[var(--text-secondary)] leading-relaxed">
 <strong className="text-[var(--text-primary)] ">Students:</strong> Must provide accurate personal information. Must not share account credentials. Are responsible for managing certificate visibility and access approvals.
 </p>
 <p className="text-[var(--text-secondary)] leading-relaxed">
 <strong className="text-[var(--text-primary)] ">Universities:</strong> Must only issue certificates for students they have genuinely enrolled and graduated. Must not issue false or misleading certificates. Are responsible for the accuracy of all issued certificate data, including the Student ID assigned at enrollment.
 </p>
 <p className="text-[var(--text-secondary)] leading-relaxed">
 <strong className="text-[var(--text-primary)] ">Verifiers:</strong> Must only use certificate data for legitimate employment or admission verification. Must not misuse, redistribute, or falsify certificate data.
 </p>
 </div>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">3. Platform Rights</h2>
 <p className="text-[var(--text-secondary)] leading-relaxed">
 EduAuth Registry reserves the right to suspend or terminate accounts that violate these terms, revoke certificates if fraudulent issuance is detected, and modify these terms with reasonable notice.
 </p>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">4. Certificate Integrity</h2>
 <p className="text-[var(--text-secondary)] leading-relaxed">
 Certificates contain tamper-proof serial numbers. Any attempt to forge or alter a certificate is a violation of these terms and may constitute a criminal offence under applicable Bangladeshi law.
 </p>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">5. Limitation of Liability</h2>
 <p className="text-[var(--text-secondary)] leading-relaxed">
 EduAuth Registry provides this platform as-is and is not liable for disputes between students, universities, and verifiers regarding certificate content or access decisions.
 </p>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">6. Governing Law</h2>
 <p className="text-[var(--text-secondary)] leading-relaxed">
 These terms are governed by the laws of Bangladesh.
 </p>
 </section>

 </div>
 </div>
 </main>

 <Footer />
 </div>
 );
}
