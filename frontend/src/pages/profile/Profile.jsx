import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { GraduationCap, AlertCircle, LogOut, Clock, Lock, Send, XCircle, Upload, FileText, Mail, ShieldAlert } from 'lucide-react';
import Modal from '../../components/shared/Modal';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Badge from '../../components/shared/Badge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, roleLabel } from '../../utils/helpers';

// Field definitions per role
const FIELD_CONFIG = {
  student: {
    viewFields: [
      { key: 'first_name', label: 'First Name', fixed: true },
      { key: 'middle_name', label: 'Middle Name', fixed: true },
      { key: 'last_name', label: 'Last Name', fixed: true },
      { key: 'date_of_birth', label: 'Date of Birth', fixed: true },
      { key: 'nid_display', label: 'NID / Birth Certificate', fixed: true },
      { key: 'student_id', label: 'Student ID', fixed: true },
      { key: 'email', label: 'Email', editable: true },
      { key: 'phone', label: 'Phone', editable: true },
      { key: 'address', label: 'Address', editable: true, fullWidth: true },
    ],
    editableFields: ['email', 'phone', 'address'],
    approvableFields: [
      { key: 'first_name', label: 'First Name', fieldName: 'first_name', needsDocs: true },
      { key: 'middle_name', label: 'Middle Name', fieldName: 'middle_name', needsDocs: true },
      { key: 'last_name', label: 'Last Name', fieldName: 'last_name', needsDocs: true },
      { key: 'date_of_birth', label: 'Date of Birth', fieldName: 'date_of_birth', needsDocs: true },
      { key: 'nid', label: 'NID / Birth Certificate', fieldName: 'nid', needsDocs: true },
    ],
  },
  university: {
    viewFields: [
      { key: 'name', label: 'Institution Name', adminApproval: true },
      { key: 'registration_number', label: 'Registration Number', adminApproval: true },
      { key: 'city', label: 'City', fixed: true },
      { key: 'email', label: 'Email', editable: true },
      { key: 'phone', label: 'Phone', editable: true },
      { key: 'website', label: 'Website', editable: true },
      { key: 'address', label: 'Address', editable: true, fullWidth: true },
    ],
    editableFields: ['email', 'phone', 'address', 'website'],
    approvableFields: [
      { key: 'name', label: 'Institution Name', fieldName: 'name', needsDocs: true },
      { key: 'registration_number', label: 'Registration Number', fieldName: 'registration_number', needsDocs: true },
    ],
  },
  verifier: {
    viewFields: [
      { key: 'company_name', label: 'Company Name', adminApproval: true },
      { key: 'contact_person', label: 'Contact Person', fixed: true },
      { key: 'designation', label: 'Designation', fixed: true },
      { key: 'email', label: 'Email', editable: true },
      { key: 'phone', label: 'Phone', editable: true },
      { key: 'website', label: 'Website', editable: true },
      { key: 'address', label: 'Address', fixed: true, fullWidth: true },
      { key: 'purpose', label: 'Purpose', fixed: true, fullWidth: true },
    ],
    editableFields: ['email', 'phone', 'website'],
    approvableFields: [
      { key: 'company_name', label: 'Company Name', fieldName: 'company_name', needsDocs: true },
    ],
  },
  admin: {
    viewFields: [
      { key: 'email', label: 'Email Address', editable: true },
    ],
    editableFields: ['email'],
    approvableFields: [],
  },
};

export default function Profile() {
  const { user, updateLocalUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [changeRequestModal, setChangeRequestModal] = useState(null);
  const [myChangeRequests, setMyChangeRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const config = FIELD_CONFIG[user?.role] || { viewFields: [], editableFields: [], approvableFields: [] };

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/profile');
      setProfile(data.profile);
      if (data.user) updateLocalUser(data.user);

      if (data.user?.role === 'student') {
        try {
          const { data: wData } = await api.get('/student/withdrawal/requests');
          setWithdrawalRequests(wData.requests || []);
        } catch (_err) { /* ignore */ }
      }
    } catch (_error) {
      toast.error('Failed to load profile information.');
    } finally {
      setLoading(false);
    }
  }, [updateLocalUser]);

  const loadChangeRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const { data } = await api.get('/profile/change-requests');
      setMyChangeRequests(data.requests || []);
    } catch (_err) { /* ignore */ }
    finally { setLoadingRequests(false); }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);
  useEffect(() => { loadChangeRequests(); }, [loadChangeRequests]);

  const startEditing = () => {
    const form = {};
    config.editableFields.forEach((key) => {
      form[key] = profile?.[key] || '';
    });
    if (user?.role === 'university') {
      form.default_authority_name = profile?.default_authority_name || '';
      form.default_authority_title = profile?.default_authority_title || '';
    }
    setEditForm(form);
    setEditing(true);
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const { data } = await api.put('/profile', editForm);
      setProfile(data.profile);
      if (data.user) updateLocalUser(data.user);
      if (data.email_change_pending) {
        setEditing(false);
        toast.success(data.message || 'Profile updated.', { icon: '📧' });
      } else {
        setEditing(false);
        toast.success('Profile updated successfully.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Profile update failed.');
    } finally {
      setSavingProfile(false);
    }
  };

  const cancelEmailChange = async () => {
    try {
      const { data } = await api.delete('/profile/email-change');
      setProfile(data.profile);
      if (data.user) updateLocalUser(data.user);
      toast.success('Email change cancelled.');
    } catch (_err) {
      toast.error('Failed to cancel email change.');
    }
  };

  const cancelChangeRequest = async (id) => {
    try {
      await api.delete(`/profile/change-requests/${id}`);
      toast.success('Change request cancelled.');
      loadChangeRequests();
    } catch (_err) {
      toast.error('Failed to cancel request.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[50vh] items-center justify-center"><LoadingSpinner /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Profile</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            {user?.name || profile?.name || profile?.company_name || user?.email}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{roleLabel(user?.role)}</p>
        </div>

        {/* ─── PENDING EMAIL CHANGE BANNER ─── */}
        {profile?.pending_email && (
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-700/50 dark:bg-blue-900/20">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-blue-500 dark:text-blue-400" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-blue-800 dark:text-blue-300">Email change pending verification</p>
              <p className="mt-0.5 text-blue-700 dark:text-blue-400">
                A verification link has been sent to{' '}
                <span className="font-mono font-medium">{profile.pending_email}</span>.
                {' '}Your email will not change until you click the link in that email.
              </p>
            </div>
            <button
              onClick={cancelEmailChange}
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-800/40 transition"
            >
              Cancel Change
            </button>
          </div>
        )}
        {/* ─── PROFILE INFO CARD ─── */}
        <Card>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editing ? 'Edit Profile' : 'Profile Information'}
            </h2>
            {!editing ? (
              <Button onClick={startEditing}>Edit</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
                <Button onClick={saveProfile} loading={savingProfile}>Save Changes</Button>
              </div>
            )}
          </div>

          {/* VIEW MODE */}
          {!editing ? (
            <>
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {config.viewFields.map((field) => (
                  <div key={field.key} className={field.fullWidth ? 'sm:col-span-2' : ''}>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {field.label}
                      </p>
                      {field.fixed && <Lock className="h-3 w-3 text-gray-400" />}
                      {field.adminApproval && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {field.key === 'nid_display'
                        ? (() => {
                            const val = profile?.[field.key];
                            if (!val)
                              return (
                                <span className="italic text-gray-400">
                                  NID registered (not displayable)
                                </span>
                              );
                            if (val.startsWith('NID on file'))
                              return <span className="italic text-gray-400 text-xs">{val}</span>;
                            return (
                              <span
                                className="inline-flex items-center gap-1.5 font-mono tracking-wider"
                                title="Your NID is partially hidden for security."
                              >
                                <ShieldAlert className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                {val}
                              </span>
                            );
                          })()
                        : (profile?.[field.key] || <span className="italic text-gray-400">Not assigned</span>)
                      }
                    </p>
                  </div>
                ))}
              </div>

              {user?.role === 'university' && (
                <div className="mt-6 border-t border-gray-100 pt-6 dark:border-gray-800">
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-400">
                    Default Certificate Authority
                  </h3>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Default Authority Name
                      </p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        {profile?.default_authority_name || <span className="italic text-gray-400">Not assigned</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Default Authority Title
                      </p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        {profile?.default_authority_title || <span className="italic text-gray-400">Not assigned</span>}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* EDIT MODE */
            <div className="mt-6 space-y-6">
              {/* Section A: Instant Updates */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-green-600 dark:text-green-400">
                  ✓ Update Instantly
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {config.editableFields.map((key) => {
                    const field = config.viewFields.find((f) => f.key === key);
                    if (key === 'address') {
                      return (
                        <div key={key} className="sm:col-span-2">
                          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{field?.label || key}</label>
                          <textarea
                            className="input-field"
                            rows={3}
                            value={editForm[key] || ''}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, [key]: e.target.value }))}
                          />
                        </div>
                      );
                    }
                    return (
                      <Input
                        key={key}
                        label={field?.label || key}
                        value={editForm[key] || ''}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, [key]: e.target.value }))}
                      />
                    );
                  })}
                </div>
              </div>

              {user?.role === 'university' && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-blue-600 dark:text-blue-400">
                    Default Certificate Authority
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Default Authority Name"
                      value={editForm.default_authority_name || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, default_authority_name: e.target.value }))}
                      placeholder="e.g., Prof. Dr. John Smith"
                    />
                    <Input
                      label="Default Authority Title"
                      value={editForm.default_authority_title || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, default_authority_title: e.target.value }))}
                      placeholder="e.g., Vice Chancellor"
                    />
                  </div>
                </div>
              )}

              {/* Section B: Admin Approval */}
              {config.approvableFields.length > 0 && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-amber-600 dark:text-amber-400">
                    🔒 Requires Admin Approval
                  </h3>
                  <div className="space-y-3">
                    {config.approvableFields.map((field) => {
                      const pendingReq = myChangeRequests.find(
                        (r) => r.field_name === field.fieldName && r.status === 'pending'
                      );
                      return (
                        <div
                          key={field.fieldName}
                          className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-900/30"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{field.label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Current: {profile?.[field.key] || 'N/A'}
                            </p>
                          </div>
                          {pendingReq ? (
                            <Badge variant="warning">Pending</Badge>
                          ) : (
                            <Button
                              variant="secondary"
                              onClick={() =>
                                setChangeRequestModal({
                                  fieldName: field.fieldName,
                                  label: field.label,
                                  currentValue: profile?.[field.key] || '',
                                  needsDocs: field.needsDocs || false,
                                })
                              }
                            >
                              <Send className="mr-1.5 h-3.5 w-3.5" />
                              Request Change
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* ─── MY CHANGE REQUESTS ─── */}
        {user?.role !== 'admin' && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                My Change Requests
              </h2>
              <Badge variant="secondary">{myChangeRequests.length} total</Badge>
            </div>

            {loadingRequests ? (
              <div className="flex justify-center py-8"><LoadingSpinner /></div>
            ) : myChangeRequests.length > 0 ? (
              <div className="space-y-3">
                {myChangeRequests.map((req) => {
                  const statusVariant =
                    req.status === 'approved' ? 'success' :
                    req.status === 'rejected' ? 'danger' : 'warning';
                  return (
                    <div
                      key={req.id}
                      className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/30 space-y-2"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{req.field_label}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            <span className="line-through">{req.current_value || 'N/A'}</span>
                            <span className="mx-1.5">→</span>
                            <span className="font-medium text-primary-600 dark:text-primary-400">{req.requested_value}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusVariant}>{req.status.toUpperCase()}</Badge>
                          <span className="text-xs text-gray-400">{formatDate(req.created_at)}</span>
                          {req.status === 'pending' && (
                            <button
                              onClick={() => cancelChangeRequest(req.id)}
                              className="rounded-lg p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Cancel request"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {req.status === 'rejected' && req.review_notes && (
                        <div className="rounded-lg border border-red-100 bg-red-50/50 p-3 text-xs text-red-800 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300">
                          <p className="font-semibold text-[10px] uppercase tracking-wider opacity-60 mb-1">Admin Rejection Reason</p>
                          <p>"{req.review_notes}"</p>
                        </div>
                      )}
                      {req.status === 'approved' && (
                        <div className="rounded-lg border border-green-100 bg-green-50/50 p-3 text-xs text-green-800 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-300">
                          <p className="font-medium">Change has been applied to your profile.</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center bg-gray-50/30 dark:bg-gray-900/10 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">No change requests submitted yet.</p>
              </div>
            )}
          </Card>
        )}

        {/* ─── CHANGE REQUEST MODAL ─── */}
        {changeRequestModal && (
          <ChangeRequestModal
            field={changeRequestModal}
            onClose={() => setChangeRequestModal(null)}
            onSuccess={() => {
              setChangeRequestModal(null);
              loadChangeRequests();
              toast.success('Change request submitted for admin review.');
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

// ─── CHANGE REQUEST MODAL ──────────────────────────────────────
function ChangeRequestModal({ field, onClose, onSuccess }) {
  const [requestedValue, setRequestedValue] = useState('');
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const formData = new FormData();
    formData.append('field_name', field.fieldName);
    formData.append('requested_value', requestedValue);
    formData.append('reason', reason);
    files.forEach((file) => formData.append('supporting_documents[]', file));

    try {
      await api.post('/profile/change-requests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.field_name?.[0] || 'Failed to submit request';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title={`Request Change: ${field.label}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-900/20">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Current value:</strong> {field.currentValue || 'N/A'}
          </p>
          <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
            Changes to this field require admin review and approval.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <Input
          label="New Value"
          value={requestedValue}
          onChange={(e) => setRequestedValue(e.target.value)}
          placeholder={`Enter new ${field.label.toLowerCase()}`}
          required
        />

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Reason for Change <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white min-h-[80px]"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please explain why you need this change (min 10 characters)..."
            required
            minLength={10}
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 mt-1">{reason.length}/1000 characters</p>
        </div>

        {field.needsDocs && (
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Supporting Documents <span className="text-red-500">*</span>
            </label>
            <div className="rounded-xl border-2 border-dashed border-gray-300 p-4 text-center dark:border-gray-600">
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="text-sm text-gray-600 dark:text-gray-400"
              />
              <p className="mt-1 text-xs text-gray-400">PDF, JPG, PNG — Max 5MB each, up to 3 files</p>
            </div>
            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <p key={i} className="text-xs text-gray-600 dark:text-gray-400">📎 {f.name} ({(f.size / 1024).toFixed(1)} KB)</p>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting} className="flex-1">
            <Send className="mr-2 h-4 w-4" />
            Submit Request
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── WITHDRAWAL MODAL ──────────────────────────────────────
function WithdrawalRequestModal({ enrollment, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/student/withdrawal/request', {
        enrollment_id: enrollment.id,
        reason,
      });
      toast.success(data.message || 'Withdrawal request submitted');
      onSuccess();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to submit withdrawal request';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Request Withdrawal">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-sm font-semibold text-red-800 dark:text-red-200">You are requesting withdrawal from:</p>
          <p className="mt-1 font-medium text-gray-900 dark:text-white">{enrollment.institution_name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{enrollment.program} • {enrollment.batch}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/30 dark:bg-amber-900/20">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> Your withdrawal request will be sent to the university for review.
          </p>
        </div>
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Reason for Withdrawal <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white min-h-[120px]"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please explain why you want to withdraw..."
            required
            minLength={20}
            maxLength={1000}
          />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{reason.length}/1000 characters</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="danger" loading={submitting} className="flex-1">
            <LogOut className="mr-2 h-4 w-4" />
            Submit Withdrawal Request
          </Button>
        </div>
      </form>
    </Modal>
  );
}