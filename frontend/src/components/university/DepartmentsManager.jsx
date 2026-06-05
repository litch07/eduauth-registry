import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { Building, Edit2, Plus, PowerOff, AlertTriangle } from 'lucide-react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Input from '../shared/Input';
import Modal from '../shared/Modal';
import ConfirmModal from '../shared/ConfirmModal';
import LoadingSpinner from '../shared/LoadingSpinner';
import Badge from '../shared/Badge';
import api from '../../services/api';

export default function DepartmentsManager() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [departmentToDeactivate, setDepartmentToDeactivate] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/university/departments');
      setDepartments(data.departments || []);
    } catch (error) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingDepartment(null);
    reset({ name: '', short_code: '', is_active: true });
    setModalOpen(true);
  };

  const openEditModal = (department) => {
    setEditingDepartment(department);
    reset({ name: department.name, short_code: department.short_code, is_active: department.is_active });
    setModalOpen(true);
  };

  const onSubmit = async (formData) => {
    try {
      if (editingDepartment) {
        await api.put(`/university/departments/${editingDepartment.id}`, formData);
        toast.success('Department updated successfully');
      } else {
        await api.post('/university/departments', formData);
        toast.success('Department created successfully');
      }
      setModalOpen(false);
      fetchDepartments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save department');
    }
  };

  const handleDeactivate = async () => {
    if (!departmentToDeactivate) return;
    try {
      await api.delete(`/university/departments/${departmentToDeactivate.id}`);
      toast.success('Department deactivated successfully');
      setDeactivateModalOpen(false);
      fetchDepartments();
    } catch (error) {
      toast.error('Failed to deactivate department');
    }
  };

  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Building className="h-5 w-5 text-gray-400" />
            Department Management
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Define standard departments for enrollments and certificates.
          </p>
        </div>
        <Button onClick={openAddModal} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </div>

      {loading ? (
        <div className="flex min-h-[100px] items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : departments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">No departments added yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Department Name</th>
                <th className="px-4 py-3">Short Code</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {departments.map((dept) => (
                <tr key={dept.id} className={!dept.is_active ? 'opacity-70' : ''}>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {dept.name}
                  </td>
                  <td className="px-4 py-3">{dept.short_code || '-'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={dept.is_active ? 'success' : 'default'}>
                      {dept.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => openEditModal(dept)} className="!p-1.5" title="Edit">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {dept.is_active && (
                        <Button 
                          variant="danger" 
                          onClick={() => { setDepartmentToDeactivate(dept); setDeactivateModalOpen(true); }}
                          className="!p-1.5" 
                          title="Deactivate"
                        >
                          <PowerOff className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingDepartment ? 'Edit Department' : 'Add Department'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <Input 
            label="Department Name" 
            placeholder="e.g. Computer Science and Engineering"
            {...register('name', { required: 'Name is required' })} 
            error={errors.name?.message} 
          />
          <Input 
            label="Short Code (Optional)" 
            placeholder="e.g. CSE"
            {...register('short_code')} 
            error={errors.short_code?.message} 
          />
          
          {editingDepartment && (
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" id="is_active" {...register('is_active')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">Active (visible in forms)</label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{editingDepartment ? 'Save Changes' : 'Add Department'}</Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate Confirmation */}
      <ConfirmModal
        isOpen={deactivateModalOpen}
        onClose={() => setDeactivateModalOpen(false)}
        onConfirm={handleDeactivate}
        title="Deactivate Department"
        message={`Are you sure you want to deactivate "${departmentToDeactivate?.name}"? It will no longer appear in new enrollment or certificate forms, but historical records will be preserved.`}
        confirmText="Deactivate"
        variant="warning"
        icon={<AlertTriangle className="h-6 w-6 text-warning-600" />}
      />
    </Card>
  );
}
