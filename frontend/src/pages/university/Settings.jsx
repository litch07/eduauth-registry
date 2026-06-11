import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Building2, Shield, GraduationCap, LayoutGrid, BookOpen, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Input from '../../components/shared/Input';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import Modal from '../../components/shared/Modal';
import ToggleSwitch from '../../components/shared/ToggleSwitch';
import SelectField from '../../components/shared/SelectField';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import api, { cachedGet, clearCacheFor } from '../../services/api';

const TABS = [
  { id: 'authority', label: 'Authority Defaults', icon: Shield },
  { id: 'levels', label: 'Certificate Levels', icon: GraduationCap },
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'majors', label: 'Majors', icon: BookOpen },
];

export default function UniversitySettings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'authority');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['authority', 'levels', 'departments', 'majors'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', tabId);
      return next;
    }, { replace: true });
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">University Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Configure global settings and auto-populating data.</p>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-800 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="w-full">
        {activeTab === 'authority' && <AuthoritySettings />}
        {activeTab === 'levels' && <CertificateLevels />}
        {activeTab === 'departments' && <Departments />}
        {activeTab === 'majors' && <Majors />}
      </div>
    </DashboardLayout>
  );
}

// --- Authority Settings Tab ---
function AuthoritySettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue } = useForm();

  useEffect(() => {
    // Assuming user context has institution details or we fetch from an endpoint. 
    // We can fetch profile to get institution details if not fully in user obj.
    const fetchInstitution = async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (data.user?.institution) {
          setValue('default_authority_name', data.user.institution.default_authority_name || '');
          setValue('default_authority_title', data.user.institution.default_authority_title || '');
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchInstitution();
  }, [setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.put('/university/settings/authority', data);
      toast.success('Authority defaults updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Default Signing Authority</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          These values will automatically pre-populate the certificate issuance form.
        </p>
      </div>
      <div className="px-6 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
          <Input 
            label="Authority Name" 
            placeholder="e.g. Prof. Dr. John Smith" 
            {...register('default_authority_name')} 
          />
          <Input 
            label="Authority Title" 
            placeholder="e.g. Vice Chancellor" 
            {...register('default_authority_title')} 
          />
          <Button type="submit" loading={loading}>Save Changes</Button>
        </form>
      </div>
    </Card>
  );
}

// --- Certificate Levels Tab ---
function CertificateLevels() {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const { register, handleSubmit, reset, setValue } = useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchLevels = async () => {
    try {
      const { data } = await cachedGet('/university/certificate-levels');
      setLevels(data.certificate_levels);
    } catch (err) {
      toast.error('Failed to load certificate levels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLevels(); }, []);

  const openModal = (level = null) => {
    setEditingLevel(level);
    if (level) {
      setValue('name', level.name);
      setValue('short_code', level.short_code);
    } else {
      reset({ name: '', short_code: '' });
    }
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (editingLevel) {
        await api.put(`/university/certificate-levels/${editingLevel.id}`, data);
        clearCacheFor('/university/certificate-levels');
        toast.success('Certificate level updated');
      } else {
        await api.post('/university/certificate-levels', data);
        clearCacheFor('/university/certificate-levels');
        toast.success('Certificate level created');
      }
      setModalOpen(false);
      fetchLevels();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const deactivate = async (id) => {
    try {
      await api.delete(`/university/certificate-levels/${id}`);
      clearCacheFor('/university/certificate-levels');
      toast.success('Level deactivated');
      fetchLevels();
    } catch (err) {
      toast.error('Failed to deactivate level');
    }
  };

  const reactivate = async (id) => {
    try {
      await api.post(`/university/certificate-levels/${id}/reactivate`);
      clearCacheFor('/university/certificate-levels');
      toast.success('Level reactivated');
      fetchLevels();
    } catch (err) {
      toast.error('Failed to reactivate level');
    }
  };

  if (loading) return <div className="p-8 text-center"><LoadingSpinner size="lg" /></div>;

  return (
    <>
      <Card>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Certificate Levels</h3>
              {!loading && <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">{levels.length}</span>}
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage the types of certificates your institution issues.</p>
          </div>
          <Button onClick={() => openModal()}>Add Level</Button>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {levels.map((level) => (
            <div key={level.id} className={`flex items-center justify-between px-6 py-4 transition-colors ${!level.is_active ? 'opacity-60 bg-gray-50 dark:bg-gray-900/40' : ''}`}>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className={`font-medium ${!level.is_active ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>{level.name}</h4>
                  <Badge variant={level.is_active ? 'success' : 'neutral'}>
                    {level.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Code: {level.short_code}
                  {level.student_count !== undefined && <span className="ml-3 border-l border-gray-300 dark:border-gray-700 pl-3">{level.student_count} active students</span>}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openModal(level)}>Edit</Button>
                {level.is_active ? (
                  <div className="group relative">
                    <Button variant="outline" size="sm" onClick={() => deactivate(level.id)} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Deactivate</Button>
                    <div className="absolute right-0 bottom-full mb-2 hidden w-48 rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block z-10">
                      Deactivated levels won't appear in forms, but existing certificates are unaffected.
                    </div>
                  </div>
                ) : (
                  <div className="group relative">
                    <Button variant="outline" size="sm" onClick={() => reactivate(level.id)} className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">Reactivate</Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {levels.length === 0 && (
            <div className="p-8 text-center text-gray-500">No certificate levels found. Add one to get started.</div>
          )}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingLevel ? 'Edit Certificate Level' : 'Add Certificate Level'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Name" placeholder="e.g. Bachelor of Science" {...register('name', { required: true })} />
          <Input label="Short Code" placeholder="e.g. BSc" {...register('short_code', { required: true })} />
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" loading={submitting}>Save</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// --- Departments Tab ---
function Departments() {
  const [searchParams] = useSearchParams();
  const [levels, setLevels] = useState([]);
  const [selectedLevelId, setSelectedLevelId] = useState(searchParams.get('level') || '');
  const [items, setItems] = useState([]);
  const [loadingLevels, setLoadingLevels] = useState(true);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const { register, handleSubmit, reset, setValue } = useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const { data } = await cachedGet('/university/certificate-levels');
        setLevels(data.certificate_levels);
      } catch (err) {
        toast.error('Failed to load certificate levels');
      } finally {
        setLoadingLevels(false);
      }
    };
    fetchLevels();
  }, []);

  const fetchItems = async (levelId) => {
    if (!levelId) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await cachedGet(`/university/departments?certificate_level_id=${levelId}`);
      setItems(data.departments);
    } catch (err) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(selectedLevelId);
  }, [selectedLevelId]);

  const openModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setValue('name', item.name);
      setValue('short_code', item.short_code || '');
    } else {
      reset({ name: '', short_code: '' });
    }
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (editingItem) {
        await api.put(`/university/departments/${editingItem.id}`, { ...data, certificate_level_id: selectedLevelId });
        clearCacheFor('/university/departments');
        toast.success('Department updated');
      } else {
        await api.post('/university/departments', { ...data, certificate_level_id: selectedLevelId });
        clearCacheFor('/university/departments');
        toast.success('Department created');
      }
      setModalOpen(false);
      fetchItems(selectedLevelId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const deactivate = async (id) => {
    try {
      await api.delete(`/university/departments/${id}`);
      clearCacheFor('/university/departments');
      toast.success('Department deactivated');
      fetchItems(selectedLevelId);
    } catch (err) {
      toast.error('Failed to deactivate department');
    }
  };

  const reactivate = async (id) => {
    try {
      await api.post(`/university/departments/${id}/reactivate`);
      clearCacheFor('/university/departments');
      toast.success('Department reactivated');
      fetchItems(selectedLevelId);
    } catch (err) {
      toast.error('Failed to reactivate department');
    }
  };

  if (loadingLevels) return <div className="p-8 text-center"><LoadingSpinner size="lg" /></div>;

  return (
    <>
      <Card>
        <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Departments</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage academic departments in your institution.</p>
          
          <div className="mt-6 flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 max-w-sm">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Select Certificate Level</label>
              <select 
                className="input-field block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white" 
                value={selectedLevelId} 
                onChange={(e) => setSelectedLevelId(e.target.value)}
              >
                <option value="">-- Choose a certificate level --</option>
                {levels.map(l => (
                  <option key={l.id} value={l.id}>{l.name} {l.short_code ? `(${l.short_code})` : ''}</option>
                ))}
              </select>
            </div>
            <Button onClick={() => openModal()} disabled={!selectedLevelId}>Add Department</Button>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-800 min-h-[200px]">
          {!selectedLevelId ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <AlertTriangle className="mb-2 h-8 w-8 text-gray-400" />
              <p>Select a certificate level above to manage its departments.</p>
            </div>
          ) : loading ? (
            <div className="p-8 text-center"><LoadingSpinner /></div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No departments found in this level.</div>
          ) : (
            items.map((item) => (
              <div key={item.id} className={`flex items-center justify-between px-6 py-4 transition-colors ${!item.is_active ? 'opacity-60 bg-gray-50 dark:bg-gray-900/40' : ''}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className={`font-medium ${!item.is_active ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>{item.name}</h4>
                    <Badge variant={item.is_active ? 'success' : 'neutral'}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {item.short_code && <span>Code: {item.short_code}</span>}
                    {item.short_code && item.student_count !== undefined && <span className="mx-3 border-l border-gray-300 dark:border-gray-700"></span>}
                    {item.student_count !== undefined && <span>{item.student_count} active students</span>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openModal(item)}>Edit</Button>
                  {item.is_active ? (
                    <div className="group relative">
                      <Button variant="outline" size="sm" onClick={() => deactivate(item.id)} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Deactivate</Button>
                    </div>
                  ) : (
                    <div className="group relative">
                      <Button variant="outline" size="sm" onClick={() => reactivate(item.id)} className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">Reactivate</Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit Department' : 'Add Department'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Name" placeholder="e.g. Computer Science" {...register('name', { required: true })} />
          <Input label="Short Code (Optional)" placeholder="e.g. CSE" {...register('short_code')} />
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" loading={submitting}>Save</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// --- Majors Tab ---
function Majors() {
  const [searchParams] = useSearchParams();
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState(searchParams.get('dept') || '');
  const [majors, setMajors] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingMajors, setLoadingMajors] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const { register, handleSubmit, reset, setValue } = useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const { data } = await cachedGet('/university/departments');
        setDepartments(data.departments);
      } catch (err) {
        toast.error('Failed to load departments');
      } finally {
        setLoadingDepts(false);
      }
    };
    fetchDepts();
  }, []);

  const fetchMajors = async (deptId) => {
    if (!deptId) {
      setMajors([]);
      return;
    }
    setLoadingMajors(true);
    try {
      const { data } = await cachedGet(`/university/majors?department_id=${deptId}`);
      setMajors(data.majors);
    } catch (err) {
      toast.error('Failed to load majors');
    } finally {
      setLoadingMajors(false);
    }
  };

  useEffect(() => {
    fetchMajors(selectedDeptId);
  }, [selectedDeptId]);

  const openModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setValue('name', item.name);
    } else {
      reset({ name: '' });
    }
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (editingItem) {
        await api.put(`/university/majors/${editingItem.id}`, data);
        clearCacheFor('/university/majors');
        toast.success('Major updated');
      } else {
        await api.post('/university/majors', { ...data, department_id: selectedDeptId });
        clearCacheFor('/university/majors');
        toast.success('Major created');
      }
      setModalOpen(false);
      fetchMajors(selectedDeptId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const deactivate = async (id) => {
    try {
      await api.delete(`/university/majors/${id}`);
      clearCacheFor('/university/majors');
      toast.success('Major deactivated');
      fetchMajors(selectedDeptId);
    } catch (err) {
      toast.error('Failed to deactivate major');
    }
  };

  const reactivate = async (id) => {
    try {
      await api.post(`/university/majors/${id}/reactivate`);
      clearCacheFor('/university/majors');
      toast.success('Major reactivated');
      fetchMajors(selectedDeptId);
    } catch (err) {
      toast.error('Failed to reactivate major');
    }
  };

  if (loadingDepts) return <div className="p-8 text-center"><LoadingSpinner size="lg" /></div>;

  return (
    <>
      <Card>
        <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Majors</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage majors within specific departments.</p>
          
          <div className="mt-6 flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 max-w-sm">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Select Department</label>
              <select 
                className="input-field" 
                value={selectedDeptId} 
                onChange={(e) => setSelectedDeptId(e.target.value)}
              >
                <option value="">-- Choose a department --</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <Button onClick={() => openModal()} disabled={!selectedDeptId}>Add Major</Button>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-800 min-h-[200px]">
          {!selectedDeptId ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <AlertTriangle className="mb-2 h-8 w-8 text-gray-400" />
              <p>Select a department above to manage its majors.</p>
            </div>
          ) : loadingMajors ? (
            <div className="p-8 text-center"><LoadingSpinner /></div>
          ) : majors.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No majors found in this department.</div>
          ) : (
            majors.map((item) => (
              <div key={item.id} className={`flex items-center justify-between px-6 py-4 transition-colors ${!item.is_active ? 'opacity-60 bg-gray-50 dark:bg-gray-900/40' : ''}`}>
                <div className="flex items-center gap-2">
                  <h4 className={`font-medium ${!item.is_active ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>{item.name}</h4>
                  <Badge variant={item.is_active ? 'success' : 'neutral'}>
                    {item.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openModal(item)}>Edit</Button>
                  {item.is_active ? (
                    <Button variant="outline" size="sm" onClick={() => deactivate(item.id)} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Deactivate</Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => reactivate(item.id)} className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">Reactivate</Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit Major' : 'Add Major'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Major Name" placeholder="e.g. Software Engineering" {...register('name', { required: true })} />
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" loading={submitting}>Save</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
