import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Download } from 'lucide-react';
import Select from 'react-select';
import debounce from 'lodash/debounce';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Input from '../../components/shared/Input';
import Button from '../../components/shared/Button';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import api from '../../services/api';
import toast from 'react-hot-toast';
import SelectField from '../../components/shared/SelectField';

const DEGREE_OPTIONS = [
  { value: 'Bachelor of Science', label: 'Bachelor of Science' },
  { value: 'Bachelor of Commerce', label: 'Bachelor of Commerce' },
  { value: 'Bachelor of Arts', label: 'Bachelor of Arts' },
  { value: 'Master of Business Administration', label: 'Master of Business Administration' },
  { value: 'Master of Science', label: 'Master of Science' },
  { value: 'Doctor of Philosophy', label: 'Doctor of Philosophy' },
];

const PREFIX_MAP = {
  'Bachelor of Science': 'BSc',
  'Bachelor of Commerce': 'BCom',
  'Bachelor of Arts': 'BA',
  'Master of Business Administration': 'MBA',
  'Master of Science': 'MSc',
  'Doctor of Philosophy': 'PhD',
};

const certificateSchema = yup.object().shape({
  student_id: yup.string().required('Please select a student'),
  certificate_level: yup.string().required('Certificate level is required'),
  certificate_name: yup.string().required('Certificate name is required'),
  department_id: yup.string().nullable(),
  department: yup.string().when('department_id', {
    is: (val) => !val || val === '',
    then: () => yup.string().required('Department is required'),
    otherwise: () => yup.string().nullable()
  }),
  major: yup.string().nullable(),
  session: yup.string().required('Session is required'),
  cgpa: yup.number()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .nullable()
    .min(0, 'CGPA cannot be negative')
    .max(4.0, 'CGPA cannot be greater than 4.0'),
  degree_class: yup.string().nullable(),
  issue_date: yup.date().required('Issue date is required').typeError('Please enter a valid date'),
  convocation_date: yup.date()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .nullable()
    .typeError('Please enter a valid date')
    .min(yup.ref('issue_date'), 'Convocation date must be after issue date'),

  authority_name: yup.string().required('Authority name is required'),
  authority_title: yup.string().required('Authority title is required'),
});

function SingleCertificateForm() {
  const location = useLocation();
  const preSelectedStudent = location.state?.preSelectedStudent;

  const [success, setSuccess] = useState('');
  const [serverError, setServerError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentOptions, setStudentOptions] = useState([]);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    api.get('/university/departments').then(({ data }) => {
      setDepartments(data.departments?.filter(d => d.is_active) || []);
    }).catch(console.error);
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(certificateSchema),
    defaultValues: {
      certificate_level: 'Bachelor of Science',
    },
  });

  const certificateLevel = watch('certificate_level');
  const currentPrefix = PREFIX_MAP[certificateLevel] || 'CRT';
  const currentYear = new Date().getFullYear().toString().slice(-2);

  /**
   * Fetch pre-fill data from the backend for the selected student.
   * Populates department, major, session, CGPA, degree class, and
   * the university's default authority name/title.
   */
  const fetchPrefill = useCallback(async (studentId) => {
    setPrefillLoading(true);
    try {
      const { data } = await api.get(`/university/certificates/prefill/${studentId}`);
      if (data.success && data.prefill) {
        const p = data.prefill;
        if (p.department) {
          // See if it matches a known department exactly
          const matched = departments.find(d => d.name === p.department);
          if (matched) {
            setValue('department_id', matched.id.toString());
            setValue('department', '');
          } else {
            setValue('department', p.department);
            setValue('department_id', '');
          }
        }
        if (p.major) setValue('major', p.major);
        if (p.academic_session) setValue('session', p.academic_session);
        if (p.cgpa != null) setValue('cgpa', p.cgpa);
        if (p.degree_class) setValue('degree_class', p.degree_class);
        if (p.default_authority_name) setValue('authority_name', p.default_authority_name);
        if (p.default_authority_title) setValue('authority_title', p.default_authority_title);
      }
    } catch (error) {
      console.error('Prefill failed:', error);
      // Non-blocking — the user can still fill manually
    } finally {
      setPrefillLoading(false);
    }
  }, [setValue, departments]);

  useEffect(() => {
    if (preSelectedStudent && !selectedStudent) {
      const formattedOption = {
        value: preSelectedStudent.id,
        label: `${preSelectedStudent.name} - Pre-selected from Enrollments`,
        student: preSelectedStudent
      };
      setStudentOptions([formattedOption]);
      setSelectedStudent(formattedOption);
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
          params: { search: inputValue, enrolled: true }
        });

        const options = data.students.map(student => ({
          value: student.id,
          label: `${student.name} (${student.student_id}) - ${student.email}`,
          student: student
        }));

        setStudentOptions(options);
      } catch (error) {
        console.error('Student search failed:', error);
        toast.error('Failed to search students');
      }
    }, 500),
    []
  );

  useEffect(() => {
    if (selectedStudent) {
      setValue('student_id', selectedStudent.value);
      fetchPrefill(selectedStudent.value);
    } else {
      setValue('student_id', '');
      if (!preSelectedStudent) {
        setValue('department_id', '');
        setValue('department', '');
        setValue('major', '');
        setValue('session', '');
        setValue('cgpa', '');
        setValue('degree_class', '');
        setValue('authority_name', '');
        setValue('authority_title', '');
      }
    }
  }, [selectedStudent, setValue, preSelectedStudent, fetchPrefill]);

  const onSubmit = async (data) => {
    setSuccess('');
    setServerError('');
    try {
      const payload = {
        ...data,
        student_id: Number(data.student_id),
        department_id: data.department_id ? Number(data.department_id) : null,
        cgpa: data.cgpa ? Number(data.cgpa) : null,
      };
      await api.post('/university/certificates', payload);
      setSuccess('Certificate issued successfully.');
      reset();
    } catch (requestError) {
      const responseData = requestError.response?.data;
      if (requestError.response?.status === 422 && responseData?.errors) {
        Object.entries(responseData.errors).forEach(([field, messages]) => {
          setError(field, { type: 'server', message: messages[0] });
        });
        setServerError(responseData.error || 'Please fix the highlighted fields and try again.');
      } else {
        setServerError(responseData?.error || 'Unable to issue certificate');
      }
    }
  };

  return (
    <Card className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Issue Single Certificate</h2>
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

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Search Student (enrolled in your university)
            </label>
            <Select
              options={studentOptions}
              value={selectedStudent}
              onChange={setSelectedStudent}
              onInputChange={(inputValue, { action }) => {
                if (action === 'input-change') {
                  searchStudents(inputValue);
                }
              }}
              placeholder="Type to search by name, email, or student ID..."
              noOptionsMessage={({ inputValue }) => 
                inputValue.length < 2 
                  ? "Type at least 2 characters to search" 
                  : "No enrolled students found"
              }
              isClearable
              className="react-select-container"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '42px',
                  borderColor: errors.student_id ? '#ef4444' : '#d1d5db',
                  '&:hover': {
                    borderColor: '#2563eb'
                  }
                }),
                menu: (base) => ({
                  ...base,
                  zIndex: 100
                })
              }}
            />
            {errors.student_id && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.student_id.message}</p>}
          </div>

          {selectedStudent && (
            <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl border border-primary-100 dark:border-primary-800">
              <p className="font-semibold text-gray-900 dark:text-white">{selectedStudent.student.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {selectedStudent.student.email} • ID: {selectedStudent.student.student_id}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Program: {selectedStudent.student.program} • Batch: {selectedStudent.student.batch}
              </p>
              {prefillLoading && (
                <p className="text-xs text-primary-600 dark:text-primary-400 mt-2 animate-pulse">
                  Loading enrollment data…
                </p>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <SelectField
                label="Certificate Level / Degree Type"
                options={DEGREE_OPTIONS}
                value={certificateLevel}
                onChange={(val) => setValue('certificate_level', val)}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Serial will be generated as: {currentPrefix}-{currentYear}-XXXXXX
              </p>
            </div>
            <Input label="Certificate Name" placeholder="e.g. Bachelor of Science in CSE" {...register('certificate_name')} error={errors.certificate_name?.message} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Department / Faculty
              </label>
              <select
                {...register('department_id')}
                onChange={(e) => {
                  setValue('department_id', e.target.value);
                  if (e.target.value) setValue('department', '');
                }}
                className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-primary-400 dark:focus:ring-primary-400"
              >
                <option value="">Select Department (or enter below)</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
              <Input
                placeholder="Or type custom department manually..."
                {...register('department')}
                error={errors.department?.message || errors.department_id?.message}
                disabled={!!watch('department_id')}
              />
            </div>
            <Input label="Major / Discipline" {...register('major')} error={errors.major?.message} />
            <Input label="Academic Session" {...register('session')} error={errors.session?.message} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Input label="CGPA" type="number" step="0.01" {...register('cgpa')} error={errors.cgpa?.message} />
            <Input label="Degree Class (Optional)" {...register('degree_class')} error={errors.degree_class?.message} />
            <Input type="date" label="Issue Date" {...register('issue_date')} error={errors.issue_date?.message} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input type="date" label="Convocation Date" {...register('convocation_date')} error={errors.convocation_date?.message} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Authority Name" {...register('authority_name')} error={errors.authority_name?.message} />
            <Input label="Authority Title" {...register('authority_title')} error={errors.authority_title?.message} />
          </div>
          <Button type="submit" loading={isSubmitting}>Issue Certificate</Button>
        </form>
    </Card>
  );
}

function BatchUploadForm() {
  const [file, setFile] = useState(null);
  const [templateData, setTemplateData] = useState({
    certificate_name: '',
    department_id: '',
    department: '',
    major: '',
    session: '',
    authority_name: '',
    authority_title: '',
  });
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    api.get('/university/departments').then(({ data }) => {
      setDepartments(data.departments?.filter(d => d.is_active) || []);
    }).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }
    
    setUploading(true);
    const formData = new FormData();
    formData.append('csv_file', file);
    Object.keys(templateData).forEach(key => {
      formData.append(key, templateData[key]);
    });
    
    try {
      const response = await api.post('/university/certificates/batch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
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
        responseType: 'blob'
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
      <Card>
        <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Step 1: Download CSV Template</h3>
        <Button variant="secondary" onClick={downloadTemplate}>
          <Download className="w-4 h-4 mr-2" />
          Download Sample CSV
        </Button>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Fill the template with student data. Required columns: student_email, certificate_level, issue_date
        </p>
      </Card>

      <Card>
        <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Step 2: Fill Common Certificate Data</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 items-start">
            <Input label="Certificate Name" required value={templateData.certificate_name} onChange={(e) => setTemplateData({...templateData, certificate_name: e.target.value})} />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Department
              </label>
              <select
                value={templateData.department_id || ''}
                onChange={(e) => setTemplateData({...templateData, department_id: e.target.value, department: e.target.value ? '' : templateData.department})}
                className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-primary-400 dark:focus:ring-primary-400"
              >
                <option value="">Select Department (or enter below)</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
              <Input
                placeholder="Or type custom department manually..."
                value={templateData.department || ''}
                onChange={(e) => setTemplateData({...templateData, department: e.target.value})}
                disabled={!!templateData.department_id}
                required={!templateData.department_id}
              />
            </div>
            <Input label="Major" required value={templateData.major} onChange={(e) => setTemplateData({...templateData, major: e.target.value})} />
            <Input label="Session" required value={templateData.session} onChange={(e) => setTemplateData({...templateData, session: e.target.value})} />
            <Input label="Authority Name" required value={templateData.authority_name} onChange={(e) => setTemplateData({...templateData, authority_name: e.target.value})} />
            <Input label="Authority Title" required value={templateData.authority_title} onChange={(e) => setTemplateData({...templateData, authority_title: e.target.value})} />
          </div>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Step 3: Upload CSV File</h3>
            <div className="flex flex-col gap-4">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files[0])}
                required
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/30 dark:file:text-primary-300"
              />
              <Button type="submit" disabled={uploading || !file} className="w-max">
                {uploading ? 'Processing...' : 'Upload and Issue Certificates'}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {results && (
        <Card>
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Upload Results</h3>
          <div className="space-y-2 mb-4">
            <p className="text-green-600 font-medium">✅ Processed: {results.processed}</p>
            <p className="text-red-600 font-medium">❌ Failed: {results.failed}</p>
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
        </Card>
      )}
    </div>
  );
}

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
