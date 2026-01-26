import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Mail, Building, Globe, Phone, CheckCircle, XCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';

const PendingVerifiers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [verifiers, setVerifiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [rejectModal, setRejectModal] = useState({ open: false, verifierId: null, companyName: '', reason: '' });
  const [approveModal, setApproveModal] = useState({ open: false, verifierId: null, companyName: '' });
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/pending-verifiers');
      setVerifiers(res.data.pendingVerifiers || []);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to load pending verifiers';
      setError(msg);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openApprove = (v) => {
    setApproveModal({ open: true, verifierId: v.id, companyName: v.companyName });
  };

  const closeApprove = () => setApproveModal({ open: false, verifierId: null, companyName: '' });

  const confirmApprove = async () => {
    try {
      await api.put(`/admin/verifiers/${approveModal.verifierId}/approve`);
      setSuccess('Verifier approved successfully');
      closeApprove();
      setTimeout(() => setSuccess(''), 2500);
      await fetchPending();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to approve verifier';
      setError(msg);
      console.error('Error:', err);
    }
  };

  const openReject = (v) => {
    setRejectModal({ open: true, verifierId: v.id, companyName: v.companyName, reason: '' });
  };

  const closeReject = () => setRejectModal({ open: false, verifierId: null, companyName: '', reason: '' });

  const submitReject = async () => {
    try {
      if (!rejectModal.reason.trim()) {
        setError('Rejection reason is required');
        return;
      }
      await api.put(`/admin/verifiers/${rejectModal.verifierId}/reject`, { rejectionReason: rejectModal.reason.trim() });
      setSuccess('Verifier rejected');
      closeReject();
      setTimeout(() => setSuccess(''), 2500);
      await fetchPending();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to reject verifier';
      setError(msg);
      console.error('Error:', err);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pending Verifier Approvals</h1>
            <p className="text-sm text-slate-600 dark:text-gray-300 mt-1">
              Review and approve organizations requesting certificate verification access.
            </p>
          </div>
          <button
            onClick={fetchPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Refresh
          </button>
        </div>

        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/30 px-4 py-3 text-sm text-green-700 dark:text-green-200">
            <CheckCircle className="h-4 w-4" />
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
              <div>
                <div className="font-medium text-red-900 dark:text-red-100">Error</div>
                <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
              </div>
            </div>
          </div>
        )}

        {verifiers.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle className="w-20 h-20 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Pending Verifier Registrations
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              All verifier registrations have been reviewed
            </p>
            <button
              onClick={() => navigate('/admin/verifiers')}
              className="btn-primary"
            >
              View All Verifiers
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {verifiers.map((v) => (
              <div key={v.id} className="rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Building className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{v.companyName}</p>
                      <p className="text-xs text-slate-600 dark:text-gray-300">Registered on: {v.createdAt || 'N/A'}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-1 text-xs font-semibold text-amber-700 dark:text-amber-200">Pending</span>
                </div>

                <div className="space-y-2 text-sm text-slate-700 dark:text-gray-200">
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-500 dark:text-gray-400" /><span>{v.email}</span></div>
                  {v.companyRegistration && (
                    <div className="flex items-center gap-2"><span className="text-slate-500 dark:text-gray-400 text-xs">Registration:</span><span>{v.companyRegistration}</span></div>
                  )}
                  {v.website && (
                    <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-slate-500 dark:text-gray-400" /><a href={v.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{v.website}</a></div>
                  )}
                  {v.purpose && (
                    <div><span className="rounded-full bg-slate-100 dark:bg-gray-700 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-gray-200">{v.purpose}</span></div>
                  )}
                  {v.contactPhone && (
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-500 dark:text-gray-400" /><span>{v.contactPhone}</span></div>
                  )}
                </div>

                <div className="mt-3 flex justify-between">
                  <button
                    onClick={() => setExpanded((e) => ({ ...e, [v.id]: !e[v.id] }))}
                    className="text-sm font-semibold text-primary hover:text-primary-hover flex items-center gap-1"
                  >
                    {expanded[v.id] ? (<><ChevronUp className="h-4 w-4" /> Hide Details</>) : (<><ChevronDown className="h-4 w-4" /> View Details</>)}
                  </button>
                  <div className="flex gap-3">
                    <button onClick={() => openApprove(v)} className="btn-primary text-sm">Approve</button>
                    <button onClick={() => openReject(v)} className="btn-danger text-sm">Reject</button>
                  </div>
                </div>

                {expanded[v.id] && (
                  <div className="mt-3 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-700 p-3 text-sm text-slate-700 dark:text-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-gray-400">Company</p>
                        <p className="font-medium">{v.companyName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-gray-400">Email</p>
                        <p className="font-medium">{v.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-gray-400">Registration</p>
                        <p className="font-medium">{v.companyRegistration || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-gray-400">Phone</p>
                        <p className="font-medium">{v.contactPhone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-gray-400">Website</p>
                        <p className="font-medium">{v.website ? <a href={v.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{v.website}</a> : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-gray-400">Purpose</p>
                        <p className="font-medium">{v.purpose || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-gray-400">Registered On</p>
                        <p className="font-medium">{v.createdAt || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {approveModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Approve {approveModal.companyName}?</h2>
                <button onClick={closeApprove} className="btn-secondary p-1"><X className="h-5 w-5" /></button>
              </div>
              <p className="mb-4 text-sm text-slate-700 dark:text-gray-300">This will allow them to search students and send certificate access requests</p>
              <div className="mt-2 flex gap-3">
                <button onClick={closeApprove} className="btn-secondary flex-1 text-sm">Cancel</button>
                <button onClick={confirmApprove} className="btn-primary flex-1 text-sm">Confirm Approval</button>
              </div>
            </div>
          </div>
        )}

        {rejectModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Reject {rejectModal.companyName}</h2>
                <button onClick={closeReject} className="btn-secondary p-1"><X className="h-5 w-5" /></button>
              </div>
              <p className="mb-2 text-sm text-slate-600 dark:text-gray-300">Please provide a reason for rejection</p>
              <textarea
                value={rejectModal.reason}
                onChange={(e) => setRejectModal((m) => ({ ...m, reason: e.target.value }))}
                className="h-28 w-full rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter reason (required)"
              />
              <div className="mt-4 flex gap-3">
                <button onClick={closeReject} className="btn-secondary flex-1 text-sm">Cancel</button>
                <button onClick={submitReject} className="btn-danger flex-1 text-sm">Confirm Reject</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PendingVerifiers;
