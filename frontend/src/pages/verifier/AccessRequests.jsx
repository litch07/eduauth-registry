import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import { Download, Eye, CalendarDays, Building2, User2, ChevronDown, ChevronUp, Clock, Search } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Badge from '../../components/shared/Badge';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Modal from '../../components/shared/Modal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import MyAccessRequestCard from '../../components/access/MyAccessRequestCard';
import PurposeInput from '../../components/access/PurposeInput';
import api from '../../services/api';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatDate } from '../../utils/helpers';

async function fetchCertificateBlob(id) {
  const response = await api.get(`/certificates/${id}/pdf`, { responseType: 'blob' });
  return response.data;
}

const filters = ['all', 'pending', 'approved', 'rejected'];

export default function VerifierAccessRequests() {
  const location = useLocation();

  const [requests, setRequests] = useState([]);
  const [accesses, setAccesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  
  // List filtering state
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [hashedListSearchQuery, setHashedListSearchQuery] = useState('');
  const [expandedStudents, setExpandedStudents] = useState({});

  // Request modal search state
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [purpose, setPurpose] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchTab, setSearchTab] = useState('email');
  const [duration, setDuration] = useState('30');
  const [legitimatePurpose, setLegitimatePurpose] = useState(false);
  const { refreshCount } = useNotifications();

  useEffect(() => {
    if (location.state?.autoOpenRequestModal) {
      setRequestModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsRes, accessesRes] = await Promise.all([
        api.get('/verifier/access-requests'),
        api.get('/verifier/accessible-students')
      ]);
      setRequests(requestsRes.data.requests || []);
      setAccesses(accessesRes.data.accesses || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const hashQuery = async () => {
      if (!listSearchQuery.trim()) {
        setHashedListSearchQuery('');
        return;
      }
      try {
        const msgBuffer = new TextEncoder().encode(listSearchQuery.trim());
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        setHashedListSearchQuery(hashHex);
      } catch (e) {
        setHashedListSearchQuery('');
      }
    };
    hashQuery();
  }, [listSearchQuery]);

  const filteredRequests = useMemo(() => {
    let list = requests.filter((request) => request.status === 'pending');
    
    if (listSearchQuery.trim()) {
      const q = listSearchQuery.toLowerCase();
      list = list.filter(r => {
        const studentName = r.student?.full_name || r.student?.user?.name || '';
        const email = r.student?.user?.email || '';
        return studentName.toLowerCase().includes(q) || email.toLowerCase().includes(q);
      });
    }
    return list;
  }, [requests, listSearchQuery]);

  const filteredAccesses = useMemo(() => {
    return accesses.map(access => {
      if (!listSearchQuery.trim()) return access;
      const q = listSearchQuery.toLowerCase();
      
      const nameMatches = access.student_name && access.student_name.toLowerCase().includes(q);
      const emailMatches = access.student_email && access.student_email.toLowerCase().includes(q);
      const nidMatches = access.student_nid_hash && access.student_nid_hash === hashedListSearchQuery;
      const matchingCerts = (access.certificates || []).filter(c => c.serial && c.serial.toLowerCase().includes(q));
      
      if (nameMatches || emailMatches || nidMatches) return access;
      
      if (matchingCerts.length > 0) {
        return { ...access, certificates: matchingCerts };
      }
      
      return null;
    }).filter(Boolean);
  }, [accesses, listSearchQuery, hashedListSearchQuery]);

  const toggleStudent = (studentId) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const handleSearch = async () => {
    const query = studentSearchQuery.trim();
    if (searchTab === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (searchTab === 'nid' && !/^\d{10,17}$/.test(query)) {
      toast.error('NID must be a number between 10 and 17 digits.');
      return;
    }

    setSearching(true);
    try {
      const { data } = await api.get('/verifier/students/search', {
        params: { query },
      });
      const results = data.students || [];
      setSearchResults(results);
      if (results.length > 0) {
        setSelectedStudent(results[0]);
      } else {
        setSelectedStudent(null);
      }
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to search students.');
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!selectedStudent) {
      toast.error('Select a student first.');
      return;
    }

    if (purpose.trim().length < 20) {
      toast.error('Purpose must be at least 20 characters.');
      return;
    }

    if (!legitimatePurpose) {
      toast.error('You must confirm this request is for legitimate purposes.');
      return;
    }

    const finalPurpose = `Requested Duration: ${duration} days\n\n${purpose.trim()}`;

    setSubmitting(true);
    try {
      await api.post('/verifier/access-requests', {
        student_id: selectedStudent.id,
        purpose: finalPurpose,
      });
      toast.success('Access request sent.');
      setRequestModalOpen(false);
      setStudentSearchQuery('');
      setSearchResults([]);
      setSelectedStudent(null);
      setPurpose('');
      setDuration('30');
      setLegitimatePurpose(false);
      await fetchData();
      await refreshCount();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to send access request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewPdf = async (certificate) => {
    setActionLoading(`view-${certificate.id}`);
    try {
      const blob = await fetchCertificateBlob(certificate.id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (requestError) {
      toast.error(requestError.response?.data?.error || 'Unable to open the certificate PDF.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadPdf = async (certificate) => {
    setActionLoading(`download-${certificate.id}`);
    try {
      const blob = await fetchCertificateBlob(certificate.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${certificate.serial || 'certificate'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (requestError) {
      toast.error(requestError.response?.data?.error || 'Unable to download the certificate PDF.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Certificate Requests</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Manage access to certificates</h1>
          </div>
          <Button onClick={() => setRequestModalOpen(true)}>Request Access</Button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="relative max-w-sm w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by student name, email, NID or serial..."
            value={listSearchQuery}
            onChange={(e) => setListSearchQuery(e.target.value)}
            className="block w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="space-y-10">
          {/* Active Access Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary-600" />
              Active Access
            </h2>
            {filteredAccesses.length > 0 ? (
              <div className="space-y-4">
                {filteredAccesses.map((access) => {
                  const isExpired = !access.is_active || new Date(access.expires_at) < new Date();
                  const isExpanded = expandedStudents[access.id];

                  return (
                    <Card key={access.id} className={`space-y-0 border shadow-sm transition-colors ${isExpired ? 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50' : 'border-gray-200/80 dark:border-gray-700'}`}>
                      <div 
                        className="flex cursor-pointer flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4"
                        onClick={() => toggleStudent(access.id)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className={`text-lg font-semibold ${isExpired ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                              {access.student_name || 'Unknown student'}
                            </h3>
                            {access.student_identifier && (
                              <Badge variant="secondary">{access.student_identifier}</Badge>
                            )}
                          </div>
                          <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <CalendarDays className="h-4 w-4 text-gray-400" />
                            Granted on {access.created_at ? formatDate(access.created_at) : '—'} · Access {isExpired ? 'expired on' : 'expires on'} {formatDate(access.expires_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={isExpired ? 'default' : 'success'}>
                            {isExpired ? 'Expired' : 'Active'}
                          </Badge>
                          <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); toggleStudent(access.id); }}>
                            View Certificates
                            {isExpanded ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                          </Button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="space-y-3 p-4 border-t border-gray-100 dark:border-gray-800">
                          {access.certificates?.length > 0 ? (
                            access.certificates.map((certificate) => (
                              <div
                                key={certificate.id}
                                className={`rounded-xl border p-4 ${isExpired ? 'border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}
                              >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                  <div className="space-y-1">
                                    <p className={`font-semibold ${isExpired ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                      {certificate.certificate_name || certificate.degree_title}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      Serial: <span className="font-mono">{certificate.serial}</span>
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      Issued: {formatDate(certificate.issue_date)}
                                    </p>
                                    {certificate.revoked_at ? (
                                      <Badge variant="danger">Revoked</Badge>
                                    ) : null}
                                  </div>

                                  {!isExpired && (
                                    <div className="flex flex-wrap gap-3">
                                      <Button
                                        variant="secondary"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewPdf(certificate);
                                        }}
                                        disabled={!!actionLoading || !!certificate.revoked_at}
                                      >
                                        <Eye className="mr-2 h-4 w-4" />
                                        {actionLoading === `view-${certificate.id}` ? 'Opening...' : 'View PDF'}
                                      </Button>
                                      <Button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownloadPdf(certificate);
                                        }}
                                        disabled={!!actionLoading || !!certificate.revoked_at}
                                      >
                                        <Download className="mr-2 h-4 w-4" />
                                        {actionLoading === `download-${certificate.id}` ? 'Downloading...' : 'Download PDF'}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400 text-center">
                              No certificates are available for this student yet.
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <div className="py-10 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No active access found</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">You don't have active access to any certificates or none match your search.</p>
                </div>
              </Card>
            )}
          </div>

          {/* Pending Requests Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Pending Requests
            </h2>
            {filteredRequests.length > 0 ? (
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <MyAccessRequestCard key={request.id} request={request} />
                ))}
              </div>
            ) : (
              <Card>
                <div className="py-10 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No pending requests found</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Your outgoing access requests will appear here.</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Modal open={requestModalOpen} onClose={() => setRequestModalOpen(false)} title="Request student access" size="lg">
        <div className="space-y-5">
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-2">
            {[
              { id: 'email', label: 'Email' },
              { id: 'nid', label: 'NID / Birth Cert' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setSearchTab(tab.id); setStudentSearchQuery(''); setSearchResults([]); setSelectedStudent(null); }}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  searchTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input
              label={`Search by ${searchTab === 'nid' ? 'NID' : 'Email'}`}
              value={studentSearchQuery}
              onChange={(event) => setStudentSearchQuery(event.target.value)}
              placeholder={searchTab === 'email' ? 'Enter student email' : '10-17 digit number'}
            />
            <div className="flex items-end">
              <Button variant="secondary" onClick={handleSearch} disabled={searching}>
                {searching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            You can search by email address or NID / Birth Certificate number. Student IDs cannot be used for verification searches.
          </p>

          <div className="space-y-3">
            {searchResults.length > 0 ? (
              searchResults.map((student) => (
                <div
                  key={student.id}
                  className="w-full rounded-xl border border-primary-500 bg-primary-50 px-4 py-3 text-left dark:border-primary-400 dark:bg-primary-900/20"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{student.name}</p>
                      {student.email && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{student.email}</p>
                      )}
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Status: <span className="capitalize">{student.enrollment_status}</span></p>
                      {student.institution && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Current Institution: {student.institution}</p>
                      )}
                    </div>
                  </div>
                  {(student.has_active_request || student.has_pending_request) && (
                    <div className="mt-3 rounded-lg bg-orange-100 p-2 text-sm text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                      {student.has_active_request 
                        ? 'You already have active access to this student.' 
                        : 'Your access request is awaiting approval.'}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Search using an exact identifier to find the student.
              </p>
            )}
          </div>

          {selectedStudent && !selectedStudent.has_active_request && !selectedStudent.has_pending_request && (
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <PurposeInput 
                value={purpose} 
                onChange={(event) => setPurpose(event.target.value)} 
                error={purpose.trim().length > 0 && purpose.trim().length < 20 ? 'Purpose must be at least 20 characters.' : ''}
              />
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Requested Duration</label>
                <div className="flex gap-4">
                  {[
                    { label: '7 days', value: '7' },
                    { label: '30 days', value: '30' },
                    { label: '90 days', value: '90' }
                  ].map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                      <input 
                        type="radio" 
                        name="duration" 
                        value={opt.value}
                        checked={duration === opt.value}
                        onChange={(e) => setDuration(e.target.value)}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-2 mt-2 cursor-pointer select-none">
                <div className="w-4 h-4 shrink-0 flex items-center justify-center mt-1">
                  <input 
                    type="checkbox" 
                    checked={legitimatePurpose}
                    onChange={(e) => setLegitimatePurpose(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-offset-0 focus:outline-none cursor-pointer"
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  I confirm this access request is for legitimate verification purposes and I will handle the data securely.
                </span>
              </label>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setRequestModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendRequest} 
              loading={submitting} 
              disabled={!selectedStudent || selectedStudent.has_active_request || selectedStudent.has_pending_request || purpose.trim().length < 20 || !legitimatePurpose}
            >
              Submit request
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
