import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, User, Building, Briefcase, Clock } from 'lucide-react';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';

function PendingApprovals() {
  const [data, setData] = useState({
    pendingStudents: [],
    pendingUniversities: [],
    pendingVerifiers: [],
    totalPending: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectUserId, setRejectUserId] = useState(null);
  const [rejectUserType, setRejectUserType] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/pending-approvals');
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, userType) => {
    if (!window.confirm(`Approve this ${userType}?`)) return;

    try {
      setActionLoading(userId);
      await api.post('/admin/approve-user', { userId, userType });
      alert(`${userType} approved successfully. Email notification sent.`);
      fetchPendingApprovals();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(rejectUserId);
      await api.post('/admin/reject-user', {
        userId: rejectUserId,
        userType: rejectUserType,
        rejectionReason
      });
      alert(`${rejectUserType} rejected.`);
      setShowRejectModal(false);
      setRejectionReason('');
      fetchPendingApprovals();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const renderUserCard = (user, userType, icon) => (
    <div key={user.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            {icon}
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {userType === 'STUDENT'
                ? `${user.firstName} ${user.lastName}`
                : userType === 'UNIVERSITY'
                ? user.name
                : user.companyName}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {user.email}
            </div>
          </div>
        </div>
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <Clock className="w-4 h-4 mr-1" />
          {new Date(user.createdAt).toLocaleDateString()}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        {userType === 'STUDENT' && (
          <>
            <div>
              <span className="text-gray-600 dark:text-gray-400">NID:</span>
              <div className="font-medium text-gray-900 dark:text-white">{user.nid}</div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">DOB:</span>
              <div className="font-medium text-gray-900 dark:text-white">{user.dateOfBirth}</div>
            </div>
          </>
        )}

        {userType === 'UNIVERSITY' && (
          <>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Reg. Number:</span>
              <div className="font-medium text-gray-900 dark:text-white">{user.registrationNumber}</div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">City:</span>
              <div className="font-medium text-gray-900 dark:text-white">{user.city}</div>
            </div>
          </>
        )}

        {userType === 'VERIFIER' && (
          <>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Purpose:</span>
              <div className="font-medium text-gray-900 dark:text-white">{user.purpose}</div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Phone:</span>
              <div className="font-medium text-gray-900 dark:text-white">{user.contactPhone}</div>
            </div>
          </>
        )}
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => handleApprove(user.id, userType)}
          disabled={actionLoading === user.id}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center transition disabled:opacity-50"
          type="button"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Approve
        </button>
        <button
          onClick={() => {
            setRejectUserId(user.id);
            setRejectUserType(userType);
            setShowRejectModal(true);
          }}
          disabled={actionLoading === user.id}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center transition disabled:opacity-50"
          type="button"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Reject
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="font-semibold text-yellow-900 dark:text-yellow-100">
              {data.totalPending} pending approval{data.totalPending !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {data.pendingStudents.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Pending Students ({data.pendingStudents.length})
            </h2>
            <div className="grid gap-4">
              {data.pendingStudents.map((student) =>
                renderUserCard(student, 'STUDENT', <User className="w-5 h-5 text-blue-600" />)
              )}
            </div>
          </div>
        )}

        {data.pendingUniversities.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Building className="w-5 h-5 mr-2 text-green-600" />
              Pending Universities ({data.pendingUniversities.length})
            </h2>
            <div className="grid gap-4">
              {data.pendingUniversities.map((uni) =>
                renderUserCard(uni, 'UNIVERSITY', <Building className="w-5 h-5 text-green-600" />)
              )}
            </div>
          </div>
        )}

        {data.pendingVerifiers.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-purple-600" />
              Pending Verifiers ({data.pendingVerifiers.length})
            </h2>
            <div className="grid gap-4">
              {data.pendingVerifiers.map((verifier) =>
                renderUserCard(verifier, 'VERIFIER', <Briefcase className="w-5 h-5 text-purple-600" />)
              )}
            </div>
          </div>
        )}

        {data.totalPending === 0 && (
          <div className="text-center py-16">
            <CheckCircle className="w-20 h-20 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              All Caught Up
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No pending approvals at the moment.
            </p>
          </div>
        )}
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Reject {rejectUserType}?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Please provide a reason for rejection:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
              rows={4}
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                type="button"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default PendingApprovals;
