import { useMemo, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Button from '../shared/Button';
import Input from '../shared/Input';
import authService from '../../services/authService';
import EmailVerificationModal from './EmailVerificationModal';
import Card from '../shared/Card';

const baseSchema = {
  email: yup.string().email('Please enter a valid email address').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  password_confirmation: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Please confirm your password'),
  role: yup.string().oneOf(['student', 'university', 'verifier']).required(),
};

const studentSchema = yup.object().shape({
  ...baseSchema,
  first_name: yup.string().required('First name is required'),
  middle_name: yup.string().nullable(),
  last_name: yup.string().required('Last name is required'),
  nid: yup.string().required('NID is required'),
  date_of_birth: yup.string().required('Date of birth is required'),
  gender: yup.string().oneOf(['Male', 'Female', 'Other']).required('Gender is required'),
  phone: yup.string().required('Phone is required'),
  address: yup.string().nullable(),
});

const universitySchema = yup.object().shape({
  ...baseSchema,
  name: yup.string().required('Institution name is required'),
  registration_number: yup.string().required('Registration number is required'),
  city: yup.string().required('City is required'),
  phone: yup.string().required('Phone is required'),
  address: yup.string().required('Address is required'),
});

const verifierSchema = yup.object().shape({
  ...baseSchema,
  company_name: yup.string().required('Company name is required'),
  contact_person: yup.string().required('Contact person is required'),
  designation: yup.string().nullable(),
  purpose: yup.string().required('Purpose is required'),
  phone: yup.string().required('Phone is required'),
  address: yup.string().nullable(),
});

export default function RegisterForm({ defaultRole = 'student' }) {
  const [serverError, setServerError] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const [currentRole, setCurrentRole] = useState(defaultRole);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm({
    resolver: yupResolver(
      currentRole === 'student' ? studentSchema :
        currentRole === 'university' ? universitySchema :
          verifierSchema
    ),
    defaultValues: {
      role: defaultRole,
    },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    if (selectedRole && selectedRole !== currentRole) {
      setCurrentRole(selectedRole);
    }
  }, [selectedRole, currentRole]);

  const roleDescription = useMemo(() => {
    switch (selectedRole) {
      case 'student':
        return 'Register to manage and verify your certificates.';
      case 'university':
        return 'Create an institutional account for issuing certificates.';
      case 'verifier':
        return 'Request access and verify student credentials.';
      default:
        return '';
    }
  }, [selectedRole]);

  const onSubmit = async (data) => {
    setServerError('');

    try {
      const payload = { ...data };
      // For Selenium testing:
      const res = await authService.register(payload);
      if (res?.data?.verification_code) {
        window.__TEST_OTP__ = res.data.verification_code;
      }

      // Standard registration:
      // await authService.register(payload);

      setVerificationEmail(data.email);
      setModalOpen(true);
    } catch (err) {
      if (!err.response) {
        setServerError('Network error. Please ensure the backend server is running.');
        return;
      }

      const responseData = err.response?.data;

      if (err.response?.status === 422 && responseData?.errors) {
        Object.entries(responseData.errors).forEach(([field, messages]) => {
          setError(field, { type: 'server', message: messages[0] });
        });
        setServerError('Please fix the highlighted fields and try again.');
      } else {
        setServerError(responseData?.error || responseData?.message || 'Registration failed');
      }
    }
  };

  const fieldsByRole = {
    student: (
      <>
        <FormSection title="Personal Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="First Name" {...register('first_name')} error={errors.first_name?.message} />
            <Input label="Middle Name" {...register('middle_name')} error={errors.middle_name?.message} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Last Name" {...register('last_name')} error={errors.last_name?.message} />
            <Input label="NID or Birth Certificate Number" {...register('nid')} error={errors.nid?.message} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input type="date" label="Date of Birth" {...register('date_of_birth')} error={errors.date_of_birth?.message} />
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Gender</label>
              <select className="input-field" {...register('gender')}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <p className="mt-1 text-xs text-[var(--danger)]">{errors.gender.message}</p>}
            </div>
          </div>
        </FormSection>
        <FormSection title="Contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Phone" {...register('phone')} error={errors.phone?.message} />
            <Input label="Address" {...register('address')} error={errors.address?.message} />
          </div>
        </FormSection>
      </>
    ),
    university: (
      <>
        <FormSection title="Institution Details">
          <Input label="University Name" {...register('name')} error={errors.name?.message} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Registration Number" {...register('registration_number')} error={errors.registration_number?.message} />
            <Input label="City" {...register('city')} error={errors.city?.message} />
          </div>
        </FormSection>
        <FormSection title="Contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Phone" {...register('phone')} error={errors.phone?.message} />
            <Input label="Address" {...register('address')} error={errors.address?.message} />
          </div>
        </FormSection>
      </>
    ),
    verifier: (
      <>
        <FormSection title="Organization Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Company Name" {...register('company_name')} error={errors.company_name?.message} />
            <Input label="Contact Person" {...register('contact_person')} error={errors.contact_person?.message} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Designation" {...register('designation')} error={errors.designation?.message} />
            <Input label="Phone" {...register('phone')} error={errors.phone?.message} />
          </div>
        </FormSection>
        <FormSection title="Purpose">
          <Input label="Purpose of Verification" {...register('purpose')} error={errors.purpose?.message} />
          <Input label="Address" {...register('address')} error={errors.address?.message} />
        </FormSection>
      </>
    ),
  };

  return (
    <>
      <Card className="w-full !p-6 sm:!p-10 md:!p-12">
        <div className="mb-10 space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--brand)]">Create account</p>
          <h2 className="text-3xl font-bold text-[var(--text-primary)]">Register for EduAuth Registry</h2>
          <p className="text-sm text-[var(--text-secondary)]">{roleDescription}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {serverError && (
            <div className="rounded-[8px] border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
              {serverError}
            </div>
          )}

          <FormSection title="Account">
            <input type="hidden" {...register('role')} value={defaultRole} />
            <Input type="email" label="Email Address" {...register('email')} error={errors.email?.message} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input type="password" label="Password" {...register('password')} error={errors.password?.message} />
              <Input type="password" label="Confirm Password" {...register('password_confirmation')} error={errors.password_confirmation?.message} />
            </div>
          </FormSection>

          {fieldsByRole[selectedRole]}

          <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
            Register
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          Already have an account? <Link to="/login" className="font-medium text-[var(--brand)] hover:underline">Sign in</Link>
        </p>
      </Card>

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
      <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">{title}</h3>
      {children}
    </div>
  );
}
