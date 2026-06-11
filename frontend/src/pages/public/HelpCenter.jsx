import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';

const faqs = {
 students: [
 {
 q: "How do I get my certificate?",
 a: "Your university issues it directly to your account after graduation. You will receive a notification when it is available."
 },
 {
 q: "Can I control who sees my certificates?",
 a: "Yes. Set each certificate to Public or Private from your certificates page. Verifiers can only access certificates you explicitly approve."
 },
 {
 q: "What if my name changed after issuance?",
 a: "Submit a name change request from your profile settings. Once approved by an admin, certificates will reflect your new legal name on next download."
 },
 {
 q: "What is shown on my certificate?",
 a: "Your certificate shows your full legal name, the Student ID assigned by your university, certificate level, department, major, academic session, CGPA, issue date, and a unique serial number with QR code."
 }
 ],
 universities: [
 {
 q: "How do I register my institution?",
 a: "Use the University option on the registration page. Your account is reviewed and activated by a platform administrator before you can issue certificates."
 },
 {
 q: "Can I issue certificates in bulk?",
 a: "Yes. Use the Batch Upload feature on the Issue Certificate page to upload a CSV file with multiple student records."
 },
 {
 q: "What if I revoke a certificate by mistake?",
 a: "Contact the platform administrator. Revoked certificates can be restored with a valid reason by administrators."
 },
 {
 q: "How do I assign a Student ID?",
 a: "When you enroll a student, you can assign their Student ID at that time. It will appear on their certificate and their student dashboard."
 }
 ],
 verifiers: [
 {
 q: "How do I verify a certificate?",
 a: "Any public certificate can be verified instantly using its serial number or QR code on the public verification page — no account needed. For private certificates, request access from the student."
 },
 {
 q: "How do I search for a student?",
 a: "Search by email address or NID / Birth Certificate number. Student IDs cannot be used — these change between institutions."
 },
 {
 q: "How long does certificate access last?",
 a: "Duration is set when the student approves your request (7, 30, or 90 days). You will be notified when access expires."
 }
 ],
 general: [
 {
 q: "Is my data secure?",
 a: "Yes. NID and sensitive personal data is stored in hashed form. Certificates use tamper-proof serial numbers with checksums. All communication uses HTTPS."
 },
 {
 q: "How do I report a suspicious certificate?",
 a: "Use the Contact Support page or email the platform administrator directly."
 },
 {
 q: "What formats are dates shown in?",
 a: "All dates on the platform use DD/MM/YYYY format."
 }
 ]
};

function AccordionItem({ question, answer }) {
 const [isOpen, setIsOpen] = useState(false);

 return (
 <div className="border-b border-[var(--border)] last:border-0">
 <button
 className="w-full py-5 flex justify-between items-center text-left focus:outline-none group"
 onClick={() => setIsOpen(!isOpen)}
 >
 <span className="text-lg font-medium text-[var(--text-primary)] group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{question}</span>
 {isOpen ? (
 <ChevronUp className="h-5 w-5 text-primary-600 dark:text-primary-400" />
 ) : (
 <ChevronDown className="h-5 w-5 text-[var(--text-muted)] group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
 )}
 </button>
 <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 opacity-100 pb-6' : 'max-h-0 opacity-0'}`}>
 <div className="pr-8 text-[var(--text-secondary)] leading-relaxed">
 {answer}
 </div>
 </div>
 </div>
 );
}

export default function HelpCenter() {
 return (
 <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
 <PublicNavbar />
 
 <main className="flex-grow py-16 px-4 sm:px-6 lg:px-8 max-w-[1000px] mx-auto w-full">
 <div className="text-center mb-16">
 <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl mb-6">
 Help Center
 </h1>
 <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
 Find answers to common questions about EduAuth Registry.
 </p>
 </div>

 <div className="space-y-12">
 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">For Students</h2>
 <div className="bg-[var(--bg-surface)] rounded-3xl p-8 shadow-sm border border-[var(--border)] hover:shadow-md transition-shadow duration-300">
 {faqs.students.map((faq, i) => (
 <AccordionItem key={i} question={faq.q} answer={faq.a} />
 ))}
 </div>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">For Universities</h2>
 <div className="bg-[var(--bg-surface)] rounded-3xl p-8 shadow-sm border border-[var(--border)] hover:shadow-md transition-shadow duration-300">
 {faqs.universities.map((faq, i) => (
 <AccordionItem key={i} question={faq.q} answer={faq.a} />
 ))}
 </div>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">For Verifiers</h2>
 <div className="bg-[var(--bg-surface)] rounded-3xl p-8 shadow-sm border border-[var(--border)] hover:shadow-md transition-shadow duration-300">
 {faqs.verifiers.map((faq, i) => (
 <AccordionItem key={i} question={faq.q} answer={faq.a} />
 ))}
 </div>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">General</h2>
 <div className="bg-[var(--bg-surface)] rounded-3xl p-8 shadow-sm border border-[var(--border)] hover:shadow-md transition-shadow duration-300">
 {faqs.general.map((faq, i) => (
 <AccordionItem key={i} question={faq.q} answer={faq.a} />
 ))}
 </div>
 </section>
 </div>

 <div className="mt-20 text-center bg-blue-50 dark:bg-blue-900/20 rounded-3xl p-10 border border-blue-100 dark:border-blue-800/30">
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Still have questions?</h2>
 <p className="text-[var(--text-secondary)] mb-8">We're here to help. Reach out to our support team.</p>
 <Link
 to="/contact"
 className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition"
 >
 Contact Support
 </Link>
 </div>
 </main>

 <Footer />
 </div>
 );
}
