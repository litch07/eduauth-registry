import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
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

const filters = ['all', 'pending', 'approved', 'rejected'];

export default function VerifierAccessRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [purpose, setPurpose] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchTab, setSearchTab] = useState('email');
  const [duration, setDuration] = useState('30');
  const [legitimatePurpose, setLegitimatePurpose] = useState(false);
  const { refreshNotifications } = useNotifications();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/verifier/access-requests');
      setRequests(data.requests || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load access requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    if (filter === 'all') {
      return requests;
    }

    return requests.filter((request) => request.status === filter);
  }, [requests, filter]);

  const activeCount = requests.filter((request) => request.status === 'approved').length;
  const pendingCount = requests.filter((request) => request.status === 'pending').length;

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (searchTab === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (searchTab === 'nid' && !/^\d{10,17}$/.test(query)) {
      toast.error('NID must be a number between 10 and 17 digits.');
      return;
    }
    if (searchTab === 'student_id' && query.length < 3) {
      toast.error('Student ID must be at least 3 characters.');
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
      setSearchQuery('');
      setSearchResults([]);
      setSelectedStudent(null);
      setPurpose('');
      setDuration('30');
      setLegitimatePurpose(false);
      await fetchRequests();
      await refreshNotifications();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to send access request.');
    } finally {
      setSubmitting(false);
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
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Access Requests</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Request certificate access</h1>
          </div>
          <Button onClick={() => setRequestModalOpen(true)}>Request Access</Button>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <p className="text-sm text-gray-500 dark:text-gray-400">Active access</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{activeCount}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending requests</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{pendingCount}</p>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2 dark:border-gray-800">
          {filters.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
                filter === item
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request) => (
              <MyAccessRequestCard key={request.id} request={request} />
            ))
          ) : (
            <Card>
              <div className="py-10 text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No requests found</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Your access requests will appear here once you send them.</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Modal open={requestModalOpen} onClose={() => setRequestModalOpen(false)} title="Request student access" size="lg">
        <div className="space-y-5">
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-2">
            {[
              { id: 'email', label: 'Email' },
              { id: 'student_id', label: 'Student ID' },
              { id: 'nid', label: 'NID / Birth Cert' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setSearchTab(tab.id); setSearchQuery(''); setSearchResults([]); setSelectedStudent(null); }}
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
              label={`Search by ${searchTab === 'nid' ? 'NID' : searchTab === 'student_id' ? 'Student ID' : 'Email'}`}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={searchTab === 'email' ? 'Enter student email' : searchTab === 'student_id' ? 'e.g., UIU-2026-001' : '10-17 digit number'}
            />
            <div className="flex items-end">
              <Button variant="secondary" onClick={handleSearch} disabled={searching}>
                {searching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>

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
                      <p className="text-sm text-gray-500 dark:text-gray-400">{student.email}</p>
                      {student.institution && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Institution: {student.institution}</p>
                      )}
                    </div>
                    <Badge variant="primary">{student.student_id}</Badge>
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

              <label className="flex items-start gap-2 mt-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={legitimatePurpose}
                  onChange={(e) => setLegitimatePurpose(e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
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
