import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, Lock, Info } from 'lucide-react';
import Select from 'react-select';
import debounce from 'lodash/debounce';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Input from '../../components/shared/Input';
import Button from '../../components/shared/Button';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import SelectField from '../../components/shared/SelectField';
import api, { cachedGet } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

// Helper: parse DD/MM/YYYY from a date input value (YYYY-MM-DD) for display
const toDisplayDate = (isoStr) => {
  if (!isoStr) return '';
  const [y, m, d] = isoStr.split('-');
  return `${d}/${m}/${y}`;
};

// Helper: convert YYYY-MM-DD (native date input) to DD/MM/YYYY for API
const toApiDate = (inputVal) => {
  if (!inputVal) return '';
  const [y, m, d] = inputVal.split('-');
  return `${d}/${m}/${y}`;
};

const certificateSchema = yup.object().shape({
  student_id: yup.number().required('Please select a student').typeError('Please select a student'),
  certificate_level_id: yup.number().required('Certificate level is required').typeError('Certificate level is required'),
  department_id: yup.number().required('Department is required').typeError('Department is required'),
  major_id: yup.number().nullable().transform((v, o) => (o === '' ? null : v)),
  session: yup.string().required('Academic session is required'),
  cgpa: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .nullable()
    .min(0, 'CGPA cannot be negative')
    .max(4.0, 'CGPA cannot exceed 4.0'),
  degree_class: yup.string().nullable(),
  issue_date: yup.string().required('Issue date is required'),
  convocation_date: yup.string().nullable(),
  authority_name: yup.string().required('Authority name is required'),
  authority_title: yup.string().required('Authority title is required'),
});

/* ─── Read-only locked field ─────────────────────────────────────────────── */
function LockedField({ label, value, tooltip }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <Lock className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
        {tooltip && (
          <div className="group relative">
            <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
            <div className="pointer-events-none absolute left-0 bottom-full mb-1.5 z-10 hidden w-56 rounded-lg bg-gray-900 p-2 text-xs text-white shadow-lg group-hover:block dark:bg-gray-700">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300">
        {value || <span className="text-gray-400 italic">Not available</span>}
      </div>
    </div>
  );
}

/* ─── Single Certificate Form ────────────────────────────────────────────── */
function SingleCertificateForm() {
  const { user } = useAuth();
  const location = useLocation();
  const preSelectedStudent = location.state?.preSelectedStudent;

  const [success, setSuccess] = useState('');
  const [serverError, setServerError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentOptions, setStudentOptions] = useState([]);
  const [prefillLoading, setPrefillLoading] = useState(false);

  // Data populated by prefill
  const [lockedName, setLockedName] = useState('');
  const [lockedRollNumber, setLockedRollNumber] = useState('');
  const [certLevelOptions, setCertLevelOptions] = useState([]);

  // Department & major dropdowns
  const [departments, setDepartments] = useState([]);
  const [majors, setMajors] = useState([]);
  const [majorsLoading, setMajorsLoading] = useState(false);


  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
    setValue,
    watch,
    control,
  } = useForm({
    resolver: yupResolver(certificateSchema),
    defaultValues: {
      student_id: '',
      certificate_level_id: '',
      department_id: '',
      major_id: '',
      session: '',
      issue_date: new Date().toISOString().split('T')[0],
    },
  });

  // Fetch all active departments and profile defaults once
  useEffect(() => {
    cachedGet('/university/departments')
      .then(({ data }) => setDepartments(data.departments?.filter(d => d.is_active) || []))
      .catch(console.error);
      
    api.get('/profile')
      .then(({ data }) => {
        if (data.success && data.profile) {
          setValue('authority_name', data.profile.default_authority_name || '');
          setValue('authority_title', data.profile.default_authority_title || '');
        }
      })
      .catch(console.error);
  }, [setValue]);

  const watchedCertLevelId = watch('certificate_level_id');
  const watchedDeptId = watch('department_id');
  const watchedSession = watch('session');
  const isPrefillingRef = React.useRef(false);
  const isPrefillingCertRef = React.useRef(false);

  const sessionOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const seasons = ['Fall', 'Summer', 'Spring'];
    const opts = new Set();
    
    if (watchedSession) opts.add(watchedSession);
    
    for (let y = currentYear + 1; y >= currentYear - 5; y--) {
      for (const season of seasons) {
        opts.add(`${season} ${y}`);
      }
    }
    
    return Array.from(opts);
  }, [watchedSession]);

  // When certificate level changes → reset department
  useEffect(() => {
    if (isPrefillingCertRef.current) {
      isPrefillingCertRef.current = false; // consume the flag
      return;
    }
    setValue('department_id', '');
  }, [watchedCertLevelId, setValue]);

  // When department changes → reset major & reload majors
  useEffect(() => {
    if (isPrefillingRef.current) {
      isPrefillingRef.current = false; // consume the flag
      return;
    }

    setValue('major_id', '');
    setMajors([]);
    if (!watchedDeptId) return;
    setMajorsLoading(true);
    cachedGet(`/university/majors?department_id=${watchedDeptId}`)
      .then(({ data }) => setMajors(data.majors?.filter(m => m.is_active) || []))
      .catch(console.error)
      .finally(() => setMajorsLoading(false));
  }, [watchedDeptId, setValue]);

  const fetchPrefill = useCallback(async (studentId) => {
    setPrefillLoading(true);
    try {
      const { data } = await api.get(`/university/certificates/prefill/${studentId}`);
      if (data.success && data.prefill) {
        const p = data.prefill;
        setLockedName(p.student_name || '');
        setLockedRollNumber(p.roll_number || '');
        setValue('session', p.academic_session || '', { shouldValidate: true });
        if (p.certificate_levels?.length) setCertLevelOptions(p.certificate_levels);

        if (p.certificate_level_id) {
          isPrefillingCertRef.current = true;
          setTimeout(() => setValue('certificate_level_id', String(p.certificate_level_id)), 10);
        }

        if (p.department_id) {
          isPrefillingRef.current = true;
          setTimeout(() => setValue('department_id', p.department_id), 50);
          
          setMajorsLoading(true);
          cachedGet(`/university/majors?department_id=${p.department_id}`)
            .then(({ data }) => {
              setMajors(data.majors?.filter(m => m.is_active) || []);
              if (p.major_id) setTimeout(() => setValue('major_id', p.major_id), 100);
            })
            .catch(console.error)
            .finally(() => setMajorsLoading(false));
        } else {
          if (p.major_id) setTimeout(() => setValue('major_id', p.major_id), 50);
        }
        if (p.cgpa != null) setValue('cgpa', p.cgpa);
        if (p.degree_class) setValue('degree_class', p.degree_class);
        if (p.default_authority_name) setValue('authority_name', p.default_authority_name);
        if (p.default_authority_title) setValue('authority_title', p.default_authority_title);
      }
    } catch (error) {
      console.error('Prefill failed:', error);
    } finally {
      setPrefillLoading(false);
    }
  }, [setValue]);

  // Pre-selected student from Enrollments page
  useEffect(() => {
    if (preSelectedStudent && !selectedStudent) {
      const opt = {
        value: preSelectedStudent.id,
        label: `${preSelectedStudent.name} — pre-selected from Enrollments`,
        student: preSelectedStudent,
      };
      setStudentOptions([opt]);
      setSelectedStudent(opt);
      setValue('student_id', preSelectedStudent.id);
      fetchPrefill(preSelectedStudent.id);
    }
  }, [preSelectedStudent, setValue, selectedStudent, fetchPrefill]);

  const searchStudents = useCallback(
    debounce(async (inputValue) => {
      if (!inputValue || inputValue.length < 2) {
        setStudentOptions([]);
        return;
      }
      try {
        const { data } = await api.get('/university/students/search', {
          params: { q: inputValue, enrolled: true },
        });
        const options = data.students.map((s) => ({
          value: s.id,
          label: `${s.name} — ID: ${s.enrollments?.[0]?.roll_number || 'N/A'} — ${s.email}`,
          student: s,
        }));
        setStudentOptions(options);
      } catch (error) {
        toast.error('Failed to search students');
      }
    }, 450),
    []
  );

  useEffect(() => {
    if (selectedStudent) {
      setValue('student_id', selectedStudent.value);
      fetchPrefill(selectedStudent.value);
    } else {
      setValue('student_id', '');
      setLockedName('');
      setLockedRollNumber('');
      setValue('session', '');
      setCertLevelOptions([]);
    }
  }, [selectedStudent, setValue, fetchPrefill]);

  const onSubmit = async (data) => {
    setSuccess('');
    setServerError('');
    try {
      const payload = {
        student_id: Number(data.student_id),
        certificate_level_id: Number(data.certificate_level_id),
        department_id: Number(data.department_id),
        major_id: data.major_id ? Number(data.major_id) : null,
        cgpa: data.cgpa ? Number(data.cgpa) : null,
        degree_class: data.degree_class || null,
        issue_date: toApiDate(data.issue_date),
        convocation_date: data.convocation_date ? toApiDate(data.convocation_date) : null,
        authority_name: data.authority_name,
        authority_title: data.authority_title,
        session: data.session,
      };
      await api.post('/university/certificates', payload);
      setSuccess('Certificate issued successfully.');
      toast.success('Certificate issued!');
      reset();
      setSelectedStudent(null);
      setLockedName('');
      setLockedRollNumber('');
      
      // Restore default authority after reset
      api.get('/profile').then(({ data }) => {
        if (data.success && data.profile) {
          setValue('authority_name', data.profile.default_authority_name || '');
          setValue('authority_title', data.profile.default_authority_title || '');
        }
      }).catch(console.error);
    } catch (requestError) {
      const responseData = requestError.response?.data;
      if (requestError.response?.status === 422 && responseData?.errors) {
        Object.entries(responseData.errors).forEach(([field, messages]) => {
          setError(field, { type: 'server', message: messages[0] });
        });
        setServerError('Please fix the highlighted fields and try again.');
      } else {
        setServerError(responseData?.message || responseData?.error || 'Unable to issue certificate');
      }
    }
  };

  const certLevelSelectOptions = certLevelOptions.map(l => ({ value: l.id, label: `${l.name} (${l.short_code})` }));
  const deptSelectOptions = departments
    .filter(d => !watchedCertLevelId || String(d.certificate_level_id) === String(watchedCertLevelId))
    .map(d => ({ value: d.id, label: d.name }));
  const majorSelectOptions = majors.map(m => ({ value: m.id, label: m.name }));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2">
        <Card className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Issue Single Certificate</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select a student to auto-populate enrollment data.</p>
          </div>

          {preSelectedStudent && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-300">
              <p className="font-medium text-sm">
                Issuing certificate for <span className="font-bold">{preSelectedStudent.name}</span> who was just marked as graduated.
              </p>
            </div>
          )}

          {success && <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">{success}</div>}
          {serverError && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{serverError}</div>}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Student Search */}
            <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Step 1 — Select Student</h3>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Search by name, email, or Student ID
                </label>
                <Select
                  options={studentOptions}
                  value={selectedStudent}
                  onChange={setSelectedStudent}
                  onInputChange={(v, { action }) => { if (action === 'input-change') searchStudents(v); }}
                  placeholder="Type to search enrolled students…"
                  noOptionsMessage={({ inputValue }) =>
                    inputValue.length < 2 ? 'Type at least 2 characters' : 'No enrolled students found'
                  }
                  isClearable
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '42px',
                      borderColor: errors.student_id ? '#ef4444' : '#d1d5db',
                      borderRadius: '0.75rem',
                    }),
                    menu: (base) => ({ ...base, zIndex: 100 }),
                  }}
                />
                {errors.student_id && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.student_id.message}</p>}
              </div>

              {prefillLoading && (
                <div className="mt-3 flex items-center gap-2 text-xs text-primary-600 dark:text-primary-400 animate-pulse">
                  <LoadingSpinner size="sm" /> Loading enrollment data…
                </div>
              )}
            </div>

            {/* Step 2: Auto-populated (locked) fields */}
            {selectedStudent && (
              <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Step 2 — Student Details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <LockedField label="Full Legal Name" value={lockedName} />
                  <LockedField label="Student ID" value={lockedRollNumber} />
                </div>
              </div>
            )}

            {/* Step 3: Certificate Details */}
            <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Step 3 — Certificate Details</h3>
              <div className="space-y-4">
                {/* Certificate Level */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Certificate Level</label>
                  <select
                    {...register('certificate_level_id')}
                    className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select certificate level</option>
                    {certLevelSelectOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {errors.certificate_level_id && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.certificate_level_id.message}</p>}
                  {!certLevelOptions.length && selectedStudent && !prefillLoading && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">No active certificate levels. Add them in University Settings.</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Department */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
                    <select
                      {...register('department_id')}
                      disabled={!watchedCertLevelId}
                      className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-800/50"
                    >
                      <option value="">{watchedCertLevelId ? 'Select department' : 'Select a certificate level first'}</option>
                      {deptSelectOptions.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    {errors.department_id && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.department_id.message}</p>}
                  </div>

                  {/* Major — loads based on department */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Major <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <select
                      {...register('major_id')}
                      disabled={!watchedDeptId || majorsLoading}
                      className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-800/50"
                    >
                      <option value="">{watchedDeptId ? (majorsLoading ? 'Loading…' : 'Select major') : 'Select a department first'}</option>
                      {majorSelectOptions.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="CGPA" type="number" step="0.01" placeholder="e.g. 3.75" {...register('cgpa')} error={errors.cgpa?.message} />
                  <Input label="Degree Class (Optional)" placeholder="e.g. First Class" {...register('degree_class')} error={errors.degree_class?.message} />
                </div>
                
                <div className="mt-4">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Academic Session</label>
                  <select
                    {...register('session')}
                    className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select Session</option>
                    {sessionOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {errors.session && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.session.message}</p>}
                  <p className="mt-1.5 text-xs text-gray-500">Prefilled from enrollment, but you can select a different session here.</p>
                </div>
              </div>
            </div>

            {/* Step 4: Dates & Authority */}
            <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Step 4 — Dates &amp; Signing Authority</h3>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Input
                      type="date"
                      label="Issue Date"
                      {...register('issue_date')}
                      error={errors.issue_date?.message}
                    />
                    <p className="mt-1 text-xs text-gray-400">Stored as DD/MM/YYYY on certificate</p>
                  </div>
                  <div>
                    <Input
                      type="date"
                      label="Convocation Date (Optional)"
                      {...register('convocation_date')}
                      error={errors.convocation_date?.message}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Authority Name" placeholder="e.g. Prof. Dr. John Smith" {...register('authority_name')} error={errors.authority_name?.message} />
                  <Input label="Authority Title" placeholder="e.g. Vice Chancellor" {...register('authority_title')} error={errors.authority_title?.message} />
                </div>
              </div>
            </div>

            <Button type="submit" loading={isSubmitting} disabled={!selectedStudent} className="w-full sm:w-auto">
              Issue Certificate
            </Button>
          </form>
        </Card>
      </div>

      <div className="xl:col-span-1">
        <div className="sticky top-6 space-y-6">
          <Card>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">Live Preview</h3>
            <div className="aspect-[1.414/1] w-full bg-white p-[6px] shadow-sm relative overflow-hidden text-center" style={{ border: '6px solid #0d2b5e' }}>
              <div className="w-full h-full p-4 relative flex flex-col items-center" style={{ border: '2px solid #bda853' }}>
                <div className="absolute top-2 left-3 text-left">
                  {watch('convocation_date') && (
                    <div className="text-[8px] text-gray-700 font-serif">
                      <span className="font-bold text-[#0d2b5e]">Convocation Date:</span> {toDisplayDate(watch('convocation_date'))}
                    </div>
                  )}
                </div>
                
                <div className="absolute top-2 right-3 text-right">
                  <div className="text-[8px] text-gray-700 font-serif">
                    <span className="font-bold text-[#0d2b5e]">Issue Date:</span> {watch('issue_date') ? toDisplayDate(watch('issue_date')) : 'DD/MM/YYYY'}
                  </div>
                </div>

                <div className="mt-5 text-sm font-bold uppercase tracking-wider text-[#0d2b5e] leading-tight">
                  {user?.name || 'Your Institution'}
                </div>

                <div className="mt-1 text-base font-serif italic leading-tight" style={{ color: '#bda853' }}>
                  Certificate of Achievement
                </div>

                <div className="mt-2.5 text-[8px] leading-normal font-serif text-gray-700 w-[95%] mx-auto">
                  This is to certify that <span className="font-bold text-black text-[9px]">{lockedName || 'Student Name'}</span> has successfully completed the requirements for the degree of <span className="font-bold">
                    {watch('certificate_level_id') 
                      ? certLevelSelectOptions.find(o => String(o.value) === String(watch('certificate_level_id')))?.label?.split(' (')[0] || 'Program'
                      : 'Certificate Level'}
                  </span>
                  {watch('major_id') && (
                    <span> in <span className="font-bold">{majorSelectOptions.find(o => String(o.value) === String(watch('major_id')))?.label}</span></span>
                  )}.
                </div>

                <div className="mt-2 text-[7px] leading-tight font-serif text-gray-700 space-y-0.5">
                  <div>
                    Student ID: <span className="font-bold">{lockedRollNumber || 'XXXXXX'}</span>
                  </div>
                  <div>
                    Academic Session: <span className="font-bold">{watch('session') || 'YYYY-YYYY'}</span>
                  </div>
                  <div>
                    <span>CGPA: <span className="font-bold">{watch('cgpa') ? Number(watch('cgpa')).toFixed(2) : 'X.XX'}</span>/4.00</span>
                    <span> &nbsp;|&nbsp; </span>
                    <span>Class: <span className="font-bold">{watch('degree_class') || 'Division/Class'}</span></span>
                  </div>
                </div>

                <div className="mt-auto w-full flex justify-between items-end px-2 pb-1">
                  <div className="text-left flex flex-col items-center">
                    <div className="w-8 h-8 border border-gray-300 bg-gray-50 flex items-center justify-center mb-0.5">
                      <span className="text-[5px] text-gray-400">QR CODE</span>
                    </div>
                    <div className="text-[5px] text-gray-500 font-mono">Serial No: XXXXXX</div>
                  </div>
                  <div className="text-center w-20">
                    <div className="border-t border-gray-800 w-full mb-0.5"></div>
                    <div className="text-[7px] font-bold text-[#0d2b5e] leading-none font-sans mb-0.5">
                      {watch('authority_name') || 'Issuing Authority'}
                    </div>
                    <div className="text-[5px] text-gray-600 leading-none font-sans">
                      {watch('authority_title') || 'Authorized Signatory'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex items-start gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/30">
              <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                This is a structural preview. The final PDF will use your university's official certificate template.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ─── Batch Upload Form ──────────────────────────────────────────────────── */
function BatchUploadForm() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('csv_file', file);

    try {
      const response = await api.post('/university/certificates/batch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResults(response.data.results);
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Batch upload failed');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await api.get('/university/certificates/batch-template', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'certificate_batch_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Template */}
      <Card>
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Step 1: Download Template</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          The CSV must contain the following columns:
        </p>
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {['student_email', 'certificate_level_short_code', 'department_name', 'major_name', 'cgpa', 'degree_class', 'issue_date', 'convocation_date', 'authority_name', 'authority_title'].map(col => (
                  <th key={col} className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              <tr className="text-gray-500 dark:text-gray-400">
                <td className="px-3 py-2 whitespace-nowrap">student@example.com</td>
                <td className="px-3 py-2 whitespace-nowrap">BSc</td>
                <td className="px-3 py-2 whitespace-nowrap">Computer Science</td>
                <td className="px-3 py-2 whitespace-nowrap">Software Engineering</td>
                <td className="px-3 py-2">3.75</td>
                <td className="px-3 py-2 whitespace-nowrap">First Class</td>
                <td className="px-3 py-2 whitespace-nowrap">15/05/2024</td>
                <td className="px-3 py-2 whitespace-nowrap">20/06/2024</td>
                <td className="px-3 py-2 whitespace-nowrap">Prof. Dr. Smith</td>
                <td className="px-3 py-2 whitespace-nowrap">Vice Chancellor</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/40 dark:bg-amber-900/10 mb-4">
          <Info className="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
            <p><strong>Certificate Level:</strong> Use the exact short code (e.g., "BSc") found in the Certificate Levels section of University Settings.</p>
            <p><strong>Departments & Majors:</strong> Must exactly match the names you've set up in University Settings.</p>
            <p><strong>Dates:</strong> Use DD/MM/YYYY format for Issue and Convocation dates.</p>
          </div>
        </div>
        <Button variant="secondary" onClick={downloadTemplate}>
          <Download className="w-4 h-4 mr-2" />
          Download CSV Template
        </Button>
      </Card>

      {/* Step 2: Upload */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="font-semibold text-gray-900 dark:text-white">Step 2: Upload Completed CSV</h3>
          <div className="flex flex-col gap-4">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files[0])}
              required
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/30 dark:file:text-primary-300"
            />
            <Button type="submit" disabled={uploading || !file} className="w-max">
              {uploading ? 'Processing…' : 'Upload &amp; Issue Certificates'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Results */}
      {results && (
        <Card>
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Upload Results</h3>
          <div className="space-y-2 mb-4">
            <p className="text-green-600 dark:text-green-400 font-medium">✅ Processed: {results.processed}</p>
            <p className="text-red-600 dark:text-red-400 font-medium">❌ Failed: {results.failed}</p>
          </div>

          {results.errors?.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Errors:</h4>
              <div className="max-h-64 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-900/10">
                {results.errors.map((err, idx) => (
                  <div key={idx} className="text-sm text-red-600 dark:text-red-400 mb-2 last:mb-0">
                    <span className="font-semibold">Row {err.row}</span> ({err.student_email}): {err.error}
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.certificates?.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Issued Certificates:</h4>
              <div className="divide-y divide-gray-100 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {results.certificates.map((cert, idx) => (
                  <div key={idx} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="font-mono font-medium text-gray-800 dark:text-gray-200">{cert.serial}</span>
                    <span className="text-gray-500 dark:text-gray-400">{cert.student_name} · {cert.student_email}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

/* ─── Page Shell ─────────────────────────────────────────────────────────── */
export default function IssueCertificate() {
  const [activeTab, setActiveTab] = useState('single');

  return (
    <DashboardLayout>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Issue Certificate</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Generate Certificates</h1>
      </div>

      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'single' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('single')}
        >
          Single Certificate
        </Button>
        <Button
          variant={activeTab === 'batch' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('batch')}
        >
          Batch Upload
        </Button>
      </div>

      {activeTab === 'single' && <SingleCertificateForm />}
      {activeTab === 'batch' && <BatchUploadForm />}
    </DashboardLayout>
  );
}
