import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../shared/Button';
import Input from '../shared/Input';
import authService from '../../services/authService';
import EmailVerificationModal from './EmailVerificationModal';

const baseForm = {
  email: '',
  password: '',
  password_confirmation: '',
  role: 'student',
  first_name: '',
  middle_name: '',
  last_name: '',
  nid: '',
  date_of_birth: '',
  phone: '',
  address: '',
  student_id: '',
  name: '',
  registration_number: '',
  city: '',
  company_name: '',
  contact_person: '',
  purpose: '',
  designation: '',
};

export default function RegisterForm() {
  const [formData, setFormData] = useState(baseForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const role = formData.role;

  const roleDescription = useMemo(() => {
    switch (role) {
      case 'student':
        return 'Register to manage and verify your certificates.';
      case 'university':
        return 'Create an institutional account for issuing certificates.';
      case 'verifier':
        return 'Request access and verify student credentials.';
      default:
        return '';
    }
  }, [role]);

  const updateField = (field) => (event) => {
    setFormData((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        role: formData.role,
        password_confirmation: formData.password_confirmation,
      };

      await authService.register(payload);
      setVerificationEmail(formData.email);
      setModalOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const fieldsByRole = {
    student: (
      <>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="First Name" name="first_name" value={formData.first_name} onChange={updateField('first_name')} required />
          <Input label="Middle Name" name="middle_name" value={formData.middle_name} onChange={updateField('middle_name')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Last Name" name="last_name" value={formData.last_name} onChange={updateField('last_name')} required />
          <Input label="Student ID" name="student_id" value={formData.student_id} onChange={updateField('student_id')} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="NID" name="nid" value={formData.nid} onChange={updateField('nid')} required />
          <Input type="date" label="Date of Birth" name="date_of_birth" value={formData.date_of_birth} onChange={updateField('date_of_birth')} required />
        </div>
        <Input label="Phone" name="phone" value={formData.phone} onChange={updateField('phone')} required />
        <Input label="Address" name="address" value={formData.address} onChange={updateField('address')} required />
      </>
    ),
    university: (
      <>
        <Input label="University Name" name="name" value={formData.name} onChange={updateField('name')} required />
        <Input label="Registration Number" name="registration_number" value={formData.registration_number} onChange={updateField('registration_number')} required />
        <Input label="City" name="city" value={formData.city} onChange={updateField('city')} required />
        <Input label="Phone" name="phone" value={formData.phone} onChange={updateField('phone')} required />
        <Input label="Address" name="address" value={formData.address} onChange={updateField('address')} required />
      </>
    ),
    verifier: (
      <>
        <Input label="Company Name" name="company_name" value={formData.company_name} onChange={updateField('company_name')} required />
        <Input label="Contact Person" name="contact_person" value={formData.contact_person} onChange={updateField('contact_person')} required />
        <Input label="Designation" name="designation" value={formData.designation} onChange={updateField('designation')} />
        <Input label="Phone" name="phone" value={formData.phone} onChange={updateField('phone')} required />
        <Input label="Purpose" name="purpose" value={formData.purpose} onChange={updateField('purpose')} required />
        <Input label="Address" name="address" value={formData.address} onChange={updateField('address')} />
      </>
    ),
  };

  return (
    <>
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-white/90 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur dark:bg-gray-900/80">
        <div className="mb-8 space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-600">Create account</p>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Register for EduAuth</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{roleDescription}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input type="email" label="Email Address" name="email" value={formData.email} onChange={updateField('email')} required />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
              <select className="input-field" value={formData.role} onChange={updateField('role')}>
                <option value="student">Student</option>
                <option value="university">University</option>
                <option value="verifier">Verifier</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input type="password" label="Password" name="password" value={formData.password} onChange={updateField('password')} required />
            <Input type="password" label="Confirm Password" name="password_confirmation" value={formData.password_confirmation} onChange={updateField('password_confirmation')} required />
          </div>

          {fieldsByRole[role]}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating account...' : 'Register'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account? <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">Sign in</Link>
        </p>
      </div>

      <EmailVerificationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        email={verificationEmail}
        onVerified={() => navigate('/login')}
      />
    </>
  );
}
