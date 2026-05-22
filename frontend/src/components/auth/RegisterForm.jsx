import { useMemo, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Button from '../shared/Button';
import Input from '../shared/Input';
import authService from '../../services/authService';
import EmailVerificationModal from './EmailVerificationModal';

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
  phone: yup.string().required('Phone is required'),
  address: yup.string().required('Address is required'),
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

export default function RegisterForm() {
  const [serverError, setServerError] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const [currentRole, setCurrentRole] = useState('student');

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
      role: 'student',
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
      await authService.register(payload);
      
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
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              Your Student ID will be assigned by your university upon enrollment.
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="NID" {...register('nid')} error={errors.nid?.message} />
            <Input type="date" label="Date of Birth" {...register('date_of_birth')} error={errors.date_of_birth?.message} />
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
      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-white/10 bg-white/90 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur dark:bg-gray-900/80">
        <div className="mb-8 space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Create account</p>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Register for EduAuth</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{roleDescription}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {serverError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
              {serverError}
            </div>
          )}

          <FormSection title="Account">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input type="email" label="Email Address" {...register('email')} error={errors.email?.message} />
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                <select className="input-field" {...register('role')}>
                  <option value="student">Student</option>
                  <option value="university">University</option>
                  <option value="verifier">Verifier</option>
                </select>
                {errors.role && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.role.message}</p>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input type="password" label="Password" {...register('password')} error={errors.password?.message} />
              <Input type="password" label="Confirm Password" {...register('password_confirmation')} error={errors.password_confirmation?.message} />
            </div>
          </FormSection>

          {fieldsByRole[selectedRole]}

          <Button type="submit" loading={isSubmitting} className="w-full">
            Register
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
