import React from 'react';
import { BookOpen, FileText, Github, ExternalLink, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';

export default function ContactSupport() {
 return (
 <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
 <PublicNavbar />
 
 <main className="flex-grow py-16 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto w-full">
 <div className="text-center mb-16">
 <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl mb-6">
 Contact Support
 </h1>
 <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
 Get help with EduAuth Registry. We're here to assist you.
 </p>
 </div>

 <div className="grid gap-8 lg:grid-cols-2 max-w-[1000px] mx-auto">
 
 {/* LEFT - Contact Information */}
 <div className="bg-[var(--bg-surface)] rounded-3xl p-8 sm:p-12 border border-[var(--border)] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-10">Direct Contact</h2>
 
 <div className="space-y-8 flex-grow">
 <div>
 <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">Platform Administrator</h3>
 <a href="mailto:eduauthregistry@gmail.com" className="group inline-flex items-center gap-4 text-lg font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors">
 <div className="bg-primary-50 dark:bg-primary-900/30 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
 <Mail className="h-6 w-6" />
 </div>
 eduauthregistry@gmail.com
 </a>
 </div>
 
 <div>
 <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">GitHub Repository</h3>
 <a href="https://github.com/litch07/eduauth-registry/issues" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-4 text-lg font-medium text-[var(--text-primary)] hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
 <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
 <Github className="h-6 w-6" />
 </div>
 Report an Issue on GitHub
 <ExternalLink className="h-4 w-4 ml-1 opacity-50" />
 </a>
 </div>
 </div>
 
 <div className="mt-8 pt-8 border-t border-gray-100 ">
 <p className="text-sm text-[var(--text-muted)] italic">
 We aim to respond to all enquiries within 2 business days.
 </p>
 </div>
 </div>

 {/* RIGHT - Quick Help */}
 <div className="bg-[var(--bg-surface)] rounded-3xl p-8 sm:p-12 border border-[var(--border)] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-10">Before You Contact Us</h2>
 
 <div className="space-y-8">
 
 {/* Item 1 */}
 <div className="flex items-start gap-4">
 <div className="flex-shrink-0 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl">
 <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
 </div>
 <div>
 <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Check the Help Center</h3>
 <p className="text-[var(--text-secondary)] text-sm mb-3">
 Many common questions are answered in our Help Center & FAQs.
 </p>
 <Link to="/help" className="text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
 Go to Help Center &rarr;
 </Link>
 </div>
 </div>

 {/* Item 2 */}
 <div className="flex items-start gap-4">
 <div className="flex-shrink-0 bg-green-50 dark:bg-green-900/30 p-3 rounded-xl">
 <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
 </div>
 <div>
 <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Read the API Docs</h3>
 <p className="text-[var(--text-secondary)] text-sm mb-3">
 Developers looking for integration help should check the API documentation first.
 </p>
 <Link to="/api-docs" className="text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
 View API Docs &rarr;
 </Link>
 </div>
 </div>

 {/* Item 3 */}
 <div className="flex items-start gap-4">
 <div className="flex-shrink-0 bg-gray-100 dark:bg-gray-800 p-3 rounded-xl">
 <Github className="h-6 w-6 text-gray-700 " />
 </div>
 <div>
 <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Open a GitHub Issue</h3>
 <p className="text-[var(--text-secondary)] text-sm mb-3">
 Found a bug or have a feature request? Open an issue on our repository.
 </p>
 <a href="https://github.com/litch07/eduauth-registry/issues" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
 GitHub Issues <ExternalLink className="h-3 w-3 ml-1" />
 </a>
 </div>
 </div>

 </div>
 </div>

 </div>
 </main>

 <Footer />
 </div>
 );
}
