'use client';

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminProtection from '@/components/AdminProtection';
import ConfirmationModal from '@/components/ConfirmationModal';
import ThemeToggle from '@/components/ThemeToggle';
import { useActivity } from '@/components/ActivityProvider';
import { toast } from 'sonner';

interface Company {
  _id: string;
  name: string;
  logo?: string;
}

interface JobRole {
  _id: string;
  title: string;
  company: Company | string;
  level: string;
  type: string;
  location: string;
  salary: string | { min: number; max: number; currency: string };
  skills: string[];
  description: string;
  requirements: string | string[];
  registrationLastDate: string;
  applications: number;
}

export default function JobRolesManagement() {
  const router = useRouter();
  const { addActivity } = useActivity();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<JobRole | null>(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<JobRole | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    level: 'Entry-Level',
    type: 'Full-time',
    location: '',
    salary: '',
    skills: '',
    description: '',
    requirements: '',
    registrationLastDate: ''
  });

  useEffect(() => {
    fetchJobRoles();
    fetchCompanies();
  }, []);

  const fetchJobRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiCall('/api/job-roles', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setJobRoles(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching job roles:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiCall('/api/companies', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setCompanies(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await apiCall('/api/job-roles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          skills: formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill),
          company: formData.company,
          salary: formData.salary.replace(/[$,]/g, '').replace(/\s*-\s*/g, '-')
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setJobRoles(prev => [...prev, data.data]);
        
        // Log activity
        addActivity({
          action: 'created',
          entity: 'job-role',
          entityId: data.data._id,
          entityName: data.data.title,
          details: `${data.data.level} • ${data.data.type} • ${data.data.location}`
        });
        
        setFormData({
          title: '',
          company: '',
          level: 'Entry-Level',
          type: 'Full-time',
          location: '',
          salary: '',
          skills: '',
          description: '',
          requirements: '',
          registrationLastDate: ''
        });
        setIsAddModalOpen(false);
        toast.success('Job Role Added', {
          description: 'Job role has been successfully added to the database.'
        });
      } else {
        toast.error('Error Adding Job Role', {
          description: data.message
        });
      }
    } catch (error) {
      console.error('Error adding job role:', error);
      toast.error('Network Error', {
        description: 'Unable to connect to the server. Please check your connection.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRole = (role: JobRole) => {
    setEditingRole(role);
    setFormData({
      title: role.title,
      company: typeof role.company === 'string' ? role.company : role.company._id,
      level: role.level,
      type: role.type,
      location: role.location,
      salary: typeof role.salary === 'object' 
        ? `$${role.salary.min?.toLocaleString()} - $${role.salary.max?.toLocaleString()}`
        : role.salary,
      skills: Array.isArray(role.skills) ? role.skills.join(', ') : role.skills,
      description: role.description,
      requirements: Array.isArray(role.requirements) ? role.requirements.join('\n') : role.requirements,
      registrationLastDate: role.registrationLastDate ? role.registrationLastDate.split('T')[0] : ''
    });
    setIsAddModalOpen(true);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
        const response = await apiCall(`/api/job-roles/${editingRole!._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          skills: formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill),
          company: formData.company,
          salary: formData.salary.replace(/[$,]/g, '').replace(/\s*-\s*/g, '-')
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setJobRoles(prev => prev.map(role => 
          role._id === editingRole!._id ? data.data : role
        ));
        setFormData({
          title: '',
          company: '',
          level: 'Entry-Level',
          type: 'Full-time',
          location: '',
          salary: '',
          skills: '',
          description: '',
          requirements: '',
          registrationLastDate: ''
        });
        setEditingRole(null);
        setIsAddModalOpen(false);
        toast.success('Job Role Updated', {
          description: 'Job role information has been successfully updated.'
        });
      } else {
        toast.error('Error Updating Job Role', {
          description: data.message
        });
      }
    } catch (error) {
      console.error('Error updating job role:', error);
      toast.error('Network Error', {
        description: 'Unable to connect to the server. Please check your connection.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = (role: JobRole) => {
    setRoleToDelete(role);
    setIsConfirmationModalOpen(true);
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await apiCall(`/api/job-roles/${roleToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setJobRoles(prev => prev.filter(r => r._id !== roleToDelete._id));
        toast.success('Job Role Deleted', {
          description: `${roleToDelete.title} has been successfully removed from the database.`
        });
      } else {
        toast.error('Error Deleting Job Role', {
          description: data.message
        });
      }
    } catch (error) {
      console.error('Error deleting job role:', error);
      toast.error('Network Error', {
        description: 'Unable to connect to the server. Please check your connection.'
      });
    } finally {
      setIsConfirmationModalOpen(false);
      setRoleToDelete(null);
    }
  };

  const handleUpdateAllStatuses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiCall('/api/job-roles/bulk-status-update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh the job roles list
        await fetchJobRoles();
        toast.success('Statuses Updated', {
          description: 'All job role statuses have been updated based on registration deadlines.'
        });
      } else {
        toast.error('Error Updating Statuses', {
          description: data.message
        });
      }
    } catch (error) {
      console.error('Error updating statuses:', error);
      toast.error('Network Error', {
        description: 'Unable to connect to the server. Please check your connection.'
      });
    }
  };

  const handleLogout = () => {
    // Clear the token from localStorage
    localStorage.removeItem('token');
    
    // Show success message
    toast.success('Logged Out Successfully', {
      description: 'You have been logged out of the admin panel.'
    });
    
    // Redirect to landing page
    router.push('/');
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingRole(null);
    setFormData({
      title: '',
      company: '',
      level: 'Entry-Level',
      type: 'Full-time',
      location: '',
      salary: '',
      skills: '',
      description: '',
      requirements: '',
      registrationLastDate: ''
    });
  };

  const getJobStatus = (registrationLastDate: string) => {
    const today = new Date();
    const lastDate = new Date(registrationLastDate);
    return lastDate >= today ? 'Active' : 'Inactive';
  };

  const filteredRoles = jobRoles.filter(role => {
    const matchesSearch = role.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof role.company === 'string' ? role.company : role.company.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCompany = !selectedCompany || 
      (typeof role.company === 'string' ? role.company : role.company.name) === selectedCompany;
    
    const matchesStatus = !selectedStatus || 
      getJobStatus(role.registrationLastDate) === selectedStatus;
    
    return matchesSearch && matchesCompany && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <AdminProtection>
       <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Link href="/admin/dashboard" className="text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="flex items-center space-x-3 text-xl font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer"
              >
                {/* Logo Bars */}
                <div className="flex items-end space-x-1">
                  <div className="w-2 bg-indigo-600 dark:bg-indigo-400 rounded-t-sm" style={{height: '20px'}}></div>
                  <div className="w-2 bg-gray-500 dark:bg-gray-400 rounded-t-sm" style={{height: '12px'}}></div>
                  <div className="w-2 bg-indigo-700 dark:bg-indigo-300 rounded-t-sm" style={{height: '28px'}}></div>
                  <div className="w-2 bg-indigo-600 dark:bg-indigo-400 rounded-t-sm" style={{height: '24px'}}></div>
                  <div className="w-2 bg-indigo-700 dark:bg-indigo-300 rounded-t-sm" style={{height: '16px'}}></div>
                </div>
                <span>Job Roles Management</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Admin Panel</span>
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Logout"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
              <div className="relative">
                <button
                  onClick={() => router.push('/admin/profile')}
                  className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                  title="Admin Profile"
                >
                  <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">A</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Job Roles</h1>
            <p className="text-slate-600 dark:text-gray-400">Manage job positions and requirements</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleUpdateAllStatuses}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              🔄 Update Statuses
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              + Add Job Role
            </button>
          </div>
        </div>

         {/* Search and Filters */}
         <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8 transition-colors duration-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search job roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700"
                />
              </div>
            </div>
            <div className="flex gap-2 relative z-10">
              <select 
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 relative z-20 text-slate-900 dark:text-white font-medium"
              >
                <option className="text-slate-900 dark:text-white font-medium" value="">All Companies</option>
                {companies.map(company => (
                  <option key={company._id} value={company.name} className="text-slate-900 dark:text-white font-medium">
                    {company.name}
                  </option>
                ))}
              </select>
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 relative z-20 text-slate-900 dark:text-white font-medium"
              >
                <option className="text-slate-900 dark:text-white font-medium" value="">All Status</option>
                <option className="text-slate-900 dark:text-white font-medium" value="Active">🟢 Active</option>
                <option className="text-slate-900 dark:text-white font-medium" value="Inactive">🔴 Inactive</option>
              </select>
              <select className="px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 relative z-20 text-slate-900 dark:text-white font-medium">
                <option className="text-slate-900 dark:text-white font-medium">All Levels</option>
                <option className="text-slate-900 dark:text-white font-medium">Entry-Level</option>
                <option className="text-slate-900 dark:text-white font-medium">Mid-Level</option>
                <option className="text-slate-900 dark:text-white font-medium">Senior</option>
                <option className="text-slate-900 dark:text-white font-medium">Lead</option>
              </select>
            </div>
          </div>
        </div>

        {/* Job Roles List */}
        <div className="space-y-6">
          {filteredRoles.map((role) => (
            <div key={role._id} className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-2xl">
                    {(typeof role.company === 'string' ? '🏢' : role.company.logo || '🏢')}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{role.title}</h3>
                    <p className="text-slate-600 dark:text-gray-400">{(typeof role.company === 'string' ? role.company : role.company.name)} • {role.location}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full">
                          {role.level}
                        </span>
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">
                          {role.type}
                        </span>
                        <span className="text-sm text-slate-600 dark:text-gray-400">
                          {typeof role.salary === 'object' 
                            ? `$${role.salary.min?.toLocaleString()} - $${role.salary.max?.toLocaleString()}`
                            : role.salary
                          }
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center text-sm text-slate-600 dark:text-gray-400">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Last Date: {formatDate(role.registrationLastDate)}</span>
                        </div>
                      </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-slate-600 dark:text-gray-400">{role.applications} applications</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        getJobStatus(role.registrationLastDate) === 'Active' 
                          ? 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' 
                          : 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                      }`}>
                        {getJobStatus(role.registrationLastDate)}
                      </span>
                      {getJobStatus(role.registrationLastDate) === 'Active' ? (
                        <span className="text-green-600 dark:text-green-400 text-xs">🟢</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 text-xs">🔴</span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditRole(role)}
                      className="p-2 text-slate-400 hover:text-green-600 dark:text-gray-500 dark:hover:text-green-400 transition-colors"
                      title="Edit Job Role"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleDeleteRole(role)}
                      className="p-2 text-slate-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                      title="Delete Job Role"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-slate-600 dark:text-gray-400 mb-4">{role.description}</p>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Required Skills:</h4>
                <div className="flex flex-wrap gap-2">
                  {role.skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 text-sm rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Requirements:</h4>
                <div className="text-sm text-slate-600 dark:text-gray-400">
                  {Array.isArray(role.requirements) 
                    ? role.requirements.map((req, index) => (
                        <div key={index} className="mb-1">• {req}</div>
                      ))
                    : role.requirements
                  }
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Job Role Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseModal} />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 w-full max-w-3xl mx-auto z-10 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                {editingRole ? 'Edit Job Role' : 'Add New Job Role'}
              </h2>
              
              <form className="space-y-6" onSubmit={editingRole ? handleUpdateRole : handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Job Title</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900 placeholder-slate-400"
                      placeholder="e.g., Software Engineer"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Company</label>
                    <select 
                      name="company"
                      value={formData.company}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white relative z-30 text-slate-900 font-medium"
                      required
                    >
                      <option value="" className="text-slate-900 font-medium">Select Company</option>
                      {companies.map(company => (
                        <option key={company._id} value={company._id} className="text-slate-900 font-medium">
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Level</label>
                    <select 
                      name="level"
                      value={formData.level}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white relative z-30 text-slate-900 font-medium"
                    >
                      <option className="text-slate-900 font-medium">Entry-Level</option>
                      <option className="text-slate-900 font-medium">Mid-Level</option>
                      <option className="text-slate-900 font-medium">Senior</option>
                      <option className="text-slate-900 font-medium">Lead</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
                    <select 
                      name="type"
                      value={formData.type}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white relative z-30 text-slate-900 font-medium"
                    >
                      <option className="text-slate-900 font-medium">Full-time</option>
                      <option className="text-slate-900 font-medium">Part-time</option>
                      <option className="text-slate-900 font-medium">Contract</option>
                      <option className="text-slate-900 font-medium">Internship</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900 placeholder-slate-400"
                      placeholder="City, State"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Salary Range</label>
                  <input
                    type="text"
                    name="salary"
                    value={formData.salary}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900 placeholder-slate-400"
                    placeholder="e.g., $80,000 - $120,000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Registration Last Date</label>
                  <input
                    type="date"
                    name="registrationLastDate"
                    value={formData.registrationLastDate}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900 placeholder-slate-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Job Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900 placeholder-slate-400"
                    placeholder="Describe the role and responsibilities..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Required Skills</label>
                  <input
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900 placeholder-slate-400"
                    placeholder="e.g., JavaScript, React, Node.js (comma separated)"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Requirements</label>
                  <textarea
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-slate-900 placeholder-slate-400"
                    placeholder="Education, experience, and other requirements..."
                    required
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (editingRole ? 'Updating...' : 'Adding...') : (editingRole ? 'Update Job Role' : 'Add Job Role')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Confirmation Modal */}
    <ConfirmationModal
      isOpen={isConfirmationModalOpen}
      onClose={() => {
        setIsConfirmationModalOpen(false);
        setRoleToDelete(null);
      }}
      onConfirm={confirmDeleteRole}
      title="Delete Job Role"
      message={`Are you sure you want to delete "${roleToDelete?.title}"? This action cannot be undone and will remove all associated data.`}
      confirmText="Delete Job Role"
      cancelText="Cancel"
      type="danger"
    />
    </AdminProtection>
  );
}

