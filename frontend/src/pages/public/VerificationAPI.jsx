import React from 'react';
import { ExternalLink } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';

export default function VerificationAPI() {
    return (
        <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
            <PublicNavbar />

            <main className="flex-grow py-16 px-4 sm:px-6 lg:px-8 max-w-[1000px] mx-auto w-full">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl mb-6">
                        Verification API
                    </h1>
                    <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
                        Integrate certificate verification into your platform using our public API.
                    </p>
                </div>

                <div className="space-y-12">

                    {/* SECTION 1 — Overview */}
                    <section>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Overview</h2>
                        <div className="bg-[var(--bg-surface)] rounded-2xl p-6 border border-[var(--border)] shadow-sm text-[var(--text-secondary)] ">
                            <p>
                                EduAuth Registry provides a public REST API for certificate verification. No authentication is required for public certificate lookups.
                            </p>
                        </div>
                    </section>

                    {/* SECTION 2 — Base URL */}
                    <section>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Base URL</h2>
                        <div className="bg-gray-900 rounded-2xl p-4 shadow-sm overflow-x-auto border border-gray-800">
                            <code className="text-gray-200 font-mono text-sm">https://domainkinartakanai.com/api</code>
                        </div>
                    </section>

                    {/* SECTION 3 — Public Endpoints */}
                    <section>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Public Endpoints</h2>
                        <div className="space-y-6">

                            {/* Endpoint 1 */}
                            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm hover:shadow-md transition duration-300">
                                <div className="bg-[var(--bg-base)] dark:bg-gray-800/50 px-6 py-4 border-b border-[var(--border)] flex items-center gap-4">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-bold text-xs rounded-md tracking-wide">POST</span>
                                    <code className="text-[var(--text-primary)] dark:text-gray-200 font-mono text-sm">/api/verify/certificate</code>
                                </div>
                                <div className="p-6">
                                    <div className="mb-4">
                                        <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">Body:</p>
                                        <div className="bg-gray-900 rounded-lg p-4">
                                            <code className="text-green-400 font-mono text-sm">{'{ "serial_number": "BSc-26-000001M" }'}</code>
                                        </div>
                                    </div>
                                    <p className="text-[var(--text-secondary)] text-sm">
                                        Returns certificate details if the certificate is public and active.
                                    </p>
                                </div>
                            </div>

                            {/* Endpoint 2 */}
                            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm hover:shadow-md transition duration-300">
                                <div className="bg-[var(--bg-base)] dark:bg-gray-800/50 px-6 py-4 border-b border-[var(--border)] flex items-center gap-4">
                                    <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 font-bold text-xs rounded-md tracking-wide">GET</span>
                                    <code className="text-[var(--text-primary)] dark:text-gray-200 font-mono text-sm">/api/verify-link?token={'{token}'}</code>
                                </div>
                                <div className="p-6">
                                    <p className="text-[var(--text-secondary)] text-sm">
                                        Returns the verification data for the certificate linked to this token.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </section>

                    {/* SECTION 4 — Example Response */}
                    <section>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Example Response</h2>
                        <div className="bg-gray-900 rounded-2xl p-6 shadow-sm overflow-x-auto border border-gray-800">
                            <pre className="text-gray-300 font-mono text-sm leading-relaxed">
                                {`{
 "success": true,
 "data": {
 "serial_number": "BSc-26-000001M",
 "student_name": "Sadid Ahmed",
 "roll_number": "2021-CSE-045",
 "certificate_level": "Bachelor of Science",
 "department": "Computer Science",
 "major": "Software Engineering",
 "institution": "United International University",
 "session": "2021-2025",
 "issue_date": "15/06/2025",
 "status": "active",
 "verified": true
 },
 "message": "Certificate verified successfully."
}`}
                            </pre>
                        </div>
                    </section>

                    {/* SECTION 5 — Full Documentation */}
                    <section className="text-center pt-8">
                        <a
                            href="https://github.com/litch07/eduauth-registry/blob/main/API.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 justify-center rounded-xl bg-gray-900 px-8 py-4 text-base font-semibold text-white shadow-sm hover:bg-gray-800 dark:bg-[var(--bg-surface)] dark:text-[var(--text-primary)] dark:hover:bg-gray-100 transition"
                        >
                            View Full API Documentation on GitHub
                            <ExternalLink className="h-5 w-5" />
                        </a>
                    </section>

                </div>
            </main>

            <Footer />
        </div>
    );
}
