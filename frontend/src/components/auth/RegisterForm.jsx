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
  const [fieldErrors, setFieldErrors] = useState({});
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
    setFieldErrors({});
    setLoading(true);

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        role: formData.role,
        phone: formData.phone,
        address: formData.address,
      };

      if (formData.role === 'student') {
        payload.first_name = formData.first_name;
        payload.middle_name = formData.middle_name;
        payload.last_name = formData.last_name;
        payload.nid = formData.nid;
        payload.date_of_birth = formData.date_of_birth;
        payload.student_id = formData.student_id;
      } else if (formData.role === 'university') {
        payload.name = formData.name;
        payload.registration_number = formData.registration_number;
        payload.city = formData.city;
      } else if (formData.role === 'verifier') {
        payload.company_name = formData.company_name;
        payload.contact_person = formData.contact_person;
        payload.designation = formData.designation;
        payload.purpose = formData.purpose;
      }

      await authService.register(payload);

      setVerificationEmail(formData.email);
      setModalOpen(true);
    } catch (err) {
      const responseData = err.response?.data;

      if (err.response?.status === 422 && responseData?.errors) {
        setFieldErrors(responseData.errors);
        const firstMessage = Object.values(responseData.errors).flat().find(Boolean);
        setError(firstMessage || 'Please fix the highlighted fields and try again.');
      } else {
        setError(responseData?.error || responseData?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldsByRole = {
    student: (
      <>
        <FormSection title="Personal Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="First Name" name="first_name" value={formData.first_name} onChange={updateField('first_name')} error={fieldErrors.first_name?.[0]} required />
            <Input label="Middle Name" name="middle_name" value={formData.middle_name} onChange={updateField('middle_name')} error={fieldErrors.middle_name?.[0]} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Last Name" name="last_name" value={formData.last_name} onChange={updateField('last_name')} error={fieldErrors.last_name?.[0]} required />
            <Input label="Student ID" name="student_id" value={formData.student_id} onChange={updateField('student_id')} error={fieldErrors.student_id?.[0]} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="NID" name="nid" value={formData.nid} onChange={updateField('nid')} error={fieldErrors.nid?.[0]} required />
            <Input type="date" label="Date of Birth" name="date_of_birth" value={formData.date_of_birth} onChange={updateField('date_of_birth')} error={fieldErrors.date_of_birth?.[0]} required />
          </div>
        </FormSection>
        <FormSection title="Contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Phone" name="phone" value={formData.phone} onChange={updateField('phone')} error={fieldErrors.phone?.[0]} required />
            <Input label="Address" name="address" value={formData.address} onChange={updateField('address')} error={fieldErrors.address?.[0]} required />
          </div>
        </FormSection>
      </>
    ),
    university: (
      <>
        <FormSection title="Institution Details">
          <Input label="University Name" name="name" value={formData.name} onChange={updateField('name')} error={fieldErrors.name?.[0]} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Registration Number" name="registration_number" value={formData.registration_number} onChange={updateField('registration_number')} error={fieldErrors.registration_number?.[0]} required />
            <Input label="City" name="city" value={formData.city} onChange={updateField('city')} error={fieldErrors.city?.[0]} required />
          </div>
        </FormSection>
        <FormSection title="Contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Phone" name="phone" value={formData.phone} onChange={updateField('phone')} error={fieldErrors.phone?.[0]} required />
            <Input label="Address" name="address" value={formData.address} onChange={updateField('address')} error={fieldErrors.address?.[0]} required />
          </div>
        </FormSection>
      </>
    ),
    verifier: (
      <>
        <FormSection title="Organization Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Company Name" name="company_name" value={formData.company_name} onChange={updateField('company_name')} error={fieldErrors.company_name?.[0]} required />
            <Input label="Contact Person" name="contact_person" value={formData.contact_person} onChange={updateField('contact_person')} error={fieldErrors.contact_person?.[0]} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Designation" name="designation" value={formData.designation} onChange={updateField('designation')} error={fieldErrors.designation?.[0]} />
            <Input label="Phone" name="phone" value={formData.phone} onChange={updateField('phone')} error={fieldErrors.phone?.[0]} required />
          </div>
        </FormSection>
        <FormSection title="Purpose">
          <Input label="Purpose of Verification" name="purpose" value={formData.purpose} onChange={updateField('purpose')} error={fieldErrors.purpose?.[0]} required />
          <Input label="Address" name="address" value={formData.address} onChange={updateField('address')} error={fieldErrors.address?.[0]} />
        </FormSection>
      </>
    ),
  };

  return (
    <>
      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-white/10 bg-white/90 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur dark:bg-gray-900/80">
        <div className="mb-8 space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Create account</p>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Register for EduAuth</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{roleDescription}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          ) : null}

          <FormSection title="Account">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input type="email" label="Email Address" name="email" value={formData.email} onChange={updateField('email')} error={fieldErrors.email?.[0]} required />
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                <select className="input-field" value={formData.role} onChange={updateField('role')}>
                  <option value="student">Student</option>
                  <option value="university">University</option>
                  <option value="verifier">Verifier</option>
                </select>
                {fieldErrors.role?.[0] ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.role[0]}</p> : null}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input type="password" label="Password" name="password" value={formData.password} onChange={updateField('password')} error={fieldErrors.password?.[0]} required />
              <Input type="password" label="Confirm Password" name="password_confirmation" value={formData.password_confirmation} onChange={updateField('password_confirmation')} error={fieldErrors.password_confirmation?.[0]} required />
            </div>
          </FormSection>

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
        onVerified={() => navigate('/email-verified')}
      />
    </>
  );
}

function FormSection({ title, children }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500">{title}</h3>
      {children}
    </div>
  );
}
