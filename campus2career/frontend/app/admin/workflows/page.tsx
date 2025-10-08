'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminProtection from '@/components/AdminProtection';
import ConfirmationModal from '@/components/ConfirmationModal';
import { toast } from 'sonner';

interface Company {
  _id: string;
  name: string;
  logo?: string;
}

interface Stage {
  name: string;
  duration: string;
  type: string;
  order: number;
}

interface Workflow {
  _id: string;
  name: string;
  company: Company | string;
  description: string;
  difficulty: string;
  stages: Stage[];
}

export default function HiringWorkflowsManagement() {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    description: '',
    difficulty: 'Medium'
  });

  useEffect(() => {
    fetchWorkflows();
    fetchCompanies();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/workflows', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setWorkflows(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching workflows:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/companies', {
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
      const response = await fetch('http://localhost:5000/api/workflows', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          company: formData.company,
          stages: [] // Start with empty stages, can be added later
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setWorkflows(prev => [...prev, data.data]);
        setFormData({
          name: '',
          company: '',
          description: '',
          difficulty: 'Medium'
        });
        setIsAddModalOpen(false);
        toast.success('Workflow Added', {
          description: 'Workflow has been successfully added to the database.'
        });
      } else {
        toast.error('Error Adding Workflow', {
          description: data.message
        });
      }
    } catch (error) {
      console.error('Error adding workflow:', error);
      toast.error('Network Error', {
        description: 'Unable to connect to the server. Please check your connection.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setFormData({
      name: workflow.name,
      company: typeof workflow.company === 'string' ? workflow.company : workflow.company._id,
      description: workflow.description,
      difficulty: workflow.difficulty
    });
    setIsAddModalOpen(true);
  };

  const handleUpdateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/workflows/${editingWorkflow!._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          company: formData.company
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setWorkflows(prev => prev.map(workflow => 
          workflow._id === editingWorkflow!._id ? data.data : workflow
        ));
        setFormData({
          name: '',
          company: '',
          description: '',
          difficulty: 'Medium'
        });
        setEditingWorkflow(null);
        setIsAddModalOpen(false);
        toast.success('Workflow Updated', {
          description: 'Workflow information has been successfully updated.'
        });
      } else {
        toast.error('Error Updating Workflow', {
          description: data.message
        });
      }
    } catch (error) {
      console.error('Error updating workflow:', error);
      toast.error('Network Error', {
        description: 'Unable to connect to the server. Please check your connection.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWorkflow = (workflow: Workflow) => {
    setWorkflowToDelete(workflow);
    setIsConfirmationModalOpen(true);
  };

  const confirmDeleteWorkflow = async () => {
    if (!workflowToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/workflows/${workflowToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setWorkflows(prev => prev.filter(w => w._id !== workflowToDelete._id));
        toast.success('Workflow Deleted', {
          description: `${workflowToDelete.title} has been successfully removed from the database.`
        });
      } else {
        toast.error('Error Deleting Workflow', {
          description: data.message
        });
      }
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast.error('Network Error', {
        description: 'Unable to connect to the server. Please check your connection.'
      });
    } finally {
      setIsConfirmationModalOpen(false);
      setWorkflowToDelete(null);
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
    setEditingWorkflow(null);
    setFormData({
      name: '',
      company: '',
      description: '',
      difficulty: 'Medium'
    });
  };

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (typeof workflow.company === 'string' ? workflow.company : workflow.company.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                <span>Hiring Workflows</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Admin Panel</span>
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
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">A</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Hiring Workflows</h1>
            <p className="text-slate-600">Manage interview processes and evaluation criteria</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            + Create Workflow
          </button>
        </div>

         {/* Search and Filters */}
         <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search workflows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-900 placeholder-slate-400"
                />
              </div>
            </div>
            <div className="flex gap-2 relative z-10">
              <select className="px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white relative z-20 text-slate-900 font-medium">
                <option className="text-slate-900 font-medium">All Companies</option>
                <option className="text-slate-900 font-medium">Google</option>
                <option className="text-slate-900 font-medium">Microsoft</option>
                <option className="text-slate-900 font-medium">Amazon</option>
              </select>
              <select className="px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white relative z-20 text-slate-900 font-medium">
                <option className="text-slate-900 font-medium">All Difficulties</option>
                <option className="text-slate-900 font-medium">Low</option>
                <option className="text-slate-900 font-medium">Medium</option>
                <option className="text-slate-900 font-medium">High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Workflows List */}
        <div className="space-y-6">
          {filteredWorkflows.map((workflow) => (
            <div key={workflow._id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-2xl">
                    {(typeof workflow.company === 'string' ? '🏢' : workflow.company.logo || '🏢')}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{workflow.name}</h3>
                    <p className="text-slate-600">{(typeof workflow.company === 'string' ? workflow.company : workflow.company.name)}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        workflow.difficulty === 'High' ? 'bg-red-100 text-red-800' :
                        workflow.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {workflow.difficulty} Difficulty
                      </span>
                      <span className="text-sm text-slate-600">{workflow.totalDuration} total</span>
                      <span className="text-sm text-slate-600">{workflow.usage} uses</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    workflow.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {workflow.status}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditWorkflow(workflow)}
                      className="p-2 text-slate-400 hover:text-purple-600 transition-colors"
                      title="Edit Workflow"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleDeleteWorkflow(workflow)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete Workflow"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-slate-600 mb-6">{workflow.description}</p>

              {/* Workflow Stages */}
              <div>
                <h4 className="text-lg font-semibold text-slate-900 mb-4">Interview Stages</h4>
                <div className="space-y-3">
                  {workflow.stages.map((stage, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-semibold text-sm">{stage.order}</span>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-slate-900">{stage.name}</h5>
                        <p className="text-sm text-slate-600">{stage.duration} • {stage.type}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button className="p-1 text-slate-400 hover:text-purple-600 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button className="p-1 text-slate-400 hover:text-red-600 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create Workflow Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseModal} />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 w-full max-w-4xl mx-auto z-10 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                {editingWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
              </h2>
              
              <form className="space-y-6" onSubmit={editingWorkflow ? handleUpdateWorkflow : handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Workflow Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-900 placeholder-slate-400"
                      placeholder="e.g., Tech Interview Process"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Company</label>
                    <select 
                      name="company"
                      value={formData.company}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white relative z-30 text-slate-900 font-medium"
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

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-900 placeholder-slate-400"
                    placeholder="Describe the workflow and its purpose..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Difficulty Level</label>
                  <select 
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white relative z-30 text-slate-900 font-medium"
                  >
                    <option className="text-slate-900 font-medium">Low</option>
                    <option className="text-slate-900 font-medium">Medium</option>
                    <option className="text-slate-900 font-medium">High</option>
                  </select>
                </div>

                {/* Dynamic Stages */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-semibold text-slate-700">Interview Stages</label>
                    <button
                      type="button"
                      className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                    >
                      + Add Stage
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 border border-slate-300 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Stage Name</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-900 placeholder-slate-400"
                            placeholder="e.g., Phone Screening"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Duration</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-900 placeholder-slate-400"
                            placeholder="e.g., 30 min"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                          <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white relative z-30 text-slate-900 font-medium">
                            <option className="text-slate-900 font-medium">Phone</option>
                            <option className="text-slate-900 font-medium">Video</option>
                            <option className="text-slate-900 font-medium">In-person</option>
                            <option className="text-slate-900 font-medium">Panel</option>
                            <option className="text-slate-900 font-medium">Screening</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
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
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (editingWorkflow ? 'Updating...' : 'Creating...') : (editingWorkflow ? 'Update Workflow' : 'Create Workflow')}
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
        setWorkflowToDelete(null);
      }}
      onConfirm={confirmDeleteWorkflow}
      title="Delete Workflow"
      message={`Are you sure you want to delete "${workflowToDelete?.title}"? This action cannot be undone and will remove all associated data.`}
      confirmText="Delete Workflow"
      cancelText="Cancel"
      type="danger"
    />
    </AdminProtection>
  );
}

