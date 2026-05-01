import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Input from '../../components/shared/Input';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import api from '../../services/api';

export default function IssueCertificate() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    student_id: '',
    degree_title: '',
    program_name: '',
    major: '',
    registration_no: '',
    cgpa: '',
    issue_date: '',
    completion_date: '',
    is_public: true,
  });

  const updateField = (field) => (event) => {
    const value = field === 'is_public' ? event.target.value === 'true' : event.target.value;
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccess('');
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        cgpa: formData.cgpa ? Number(formData.cgpa) : null,
      };
      await api.post('/university/certificates', payload);
      setSuccess('Certificate issued successfully.');
      setFormData({
        student_id: '',
        degree_title: '',
        program_name: '',
        major: '',
        registration_no: '',
        cgpa: '',
        issue_date: '',
        completion_date: '',
        is_public: true,
      });
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to issue certificate');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-600">Issue Certificate</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Generate a new certificate</h1>
          </div>

          {success ? <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">{success}</div> : null}
          {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</div> : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Input label="Student ID" name="student_id" value={formData.student_id} onChange={updateField('student_id')} required />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Degree Title" name="degree_title" value={formData.degree_title} onChange={updateField('degree_title')} required />
              <Input label="Program Name" name="program_name" value={formData.program_name} onChange={updateField('program_name')} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Major" name="major" value={formData.major} onChange={updateField('major')} />
              <Input label="Registration No." name="registration_no" value={formData.registration_no} onChange={updateField('registration_no')} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Input label="CGPA" name="cgpa" value={formData.cgpa} onChange={updateField('cgpa')} />
              <Input type="date" label="Issue Date" name="issue_date" value={formData.issue_date} onChange={updateField('issue_date')} required />
              <Input type="date" label="Completion Date" name="completion_date" value={formData.completion_date} onChange={updateField('completion_date')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Visibility</label>
              <select className="input-field" value={formData.is_public} onChange={updateField('is_public')}>
                <option value="true">Public</option>
                <option value="false">Private</option>
              </select>
            </div>
            <Button type="submit" disabled={submitting}>{submitting ? 'Issuing...' : 'Issue Certificate'}</Button>
          </form>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Guidance</h2>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <p>Use the enrolled student list to create a serial-numbered certificate.</p>
            <p>Public certificates are instantly verifiable; private ones require access control.</p>
            <Badge variant="info">Serials are generated server-side</Badge>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
