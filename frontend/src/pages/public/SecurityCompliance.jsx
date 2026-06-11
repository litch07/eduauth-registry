import React from 'react';
import { Lock, ShieldCheck, QrCode, UserCheck, ClipboardList, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';

const securityFeatures = [
 {
 icon: <Lock className="h-8 w-8 text-blue-500" />,
 title: "Encrypted Personal Data",
 description: "NID numbers and sensitive identifiers are never stored in readable form. All sensitive fields use cryptographic hashing so original values cannot be recovered from the database."
 },
 {
 icon: <ShieldCheck className="h-8 w-8 text-green-500" />,
 title: "Tamper-Proof Certificates",
 description: "Every certificate carries a unique serial number with an embedded checksum (format: PREFIX-YY-SEQUENCECHECKSUM). Any alteration renders the serial invalid on verification."
 },
 {
 icon: <QrCode className="h-8 w-8 text-purple-500" />,
 title: "QR Code Verification",
 description: "Each certificate contains a unique QR code linking to its public verification record. Scanning confirms authenticity in real time without requiring an account."
 },
 {
 icon: <UserCheck className="h-8 w-8 text-orange-500" />,
 title: "Role-Based Access Control",
 description: "Every user sees only the data their role permits. Students cannot access other students' data. Verifiers can only view certificates a student has explicitly approved."
 },
 {
 icon: <ClipboardList className="h-8 w-8 text-indigo-500" />,
 title: "Full Audit Trail",
 description: "All significant actions — certificate issuance, access approvals, revocations, profile changes — are logged with timestamps and actor information for compliance and dispute resolution."
 },
 {
 icon: <Globe className="h-8 w-8 text-teal-500" />,
 title: "HTTPS Only",
 description: "All data transmitted between users and EduAuth Registry is encrypted in transit. Unencrypted connections are not accepted."
 }
];

export default function SecurityCompliance() {
 return (
 <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
 <PublicNavbar />
 
 <main className="flex-grow py-16 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto w-full">
 <div className="text-center mb-16">
 <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl mb-6">
 Security & Compliance
 </h1>
 <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
 How EduAuth Registry protects your data and ensures certificate integrity.
 </p>
 </div>

 <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-[1200px] mx-auto mb-20">
 {securityFeatures.map((feature, i) => (
 <div key={i} className="group bg-[var(--bg-surface)] rounded-3xl p-8 border border-[var(--border)] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-start gap-6">
 <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
 {feature.icon}
 </div>
 <div>
 <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{feature.title}</h3>
 <p className="text-[var(--text-secondary)] leading-relaxed text-sm">
 {feature.description}
 </p>
 </div>
 </div>
 ))}
 </div>

 <div className="max-w-3xl mx-auto text-center bg-blue-50 dark:bg-blue-900/20 rounded-3xl p-10 border border-blue-100 dark:border-blue-800/30">
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Have a security concern?</h2>
 <p className="text-[var(--text-secondary)] mb-8">
 If you discover a security vulnerability, please contact us immediately.
 </p>
 <Link
 to="/contact"
 className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-all hover:shadow-md hover:-translate-y-0.5"
 >
 Contact Support
 </Link>
 </div>
 </main>

 <Footer />
 </div>
 );
}
