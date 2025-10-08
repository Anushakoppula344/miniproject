'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminProtection from '@/components/AdminProtection';
import ConfirmationModal from '@/components/ConfirmationModal';
import ThemeToggle from '@/components/ThemeToggle';
import { useActivity } from '@/components/ActivityProvider';
import { useNotifications } from '@/components/NotificationProvider';
import { toast } from 'sonner';

export default function CompaniesManagement() {
  const router = useRouter();
  const { addActivity } = useActivity();
  const { addNotification } = useNotifications();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [isDocumentConfirmationModalOpen, setIsDocumentConfirmationModalOpen] = useState(false);
  const [documentToDeleteData, setDocumentToDeleteData] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: 'Technology',
    location: '',
    website: '',
    companySize: '1-50',
    description: ''
  });

  useEffect(() => {
    setIsClient(true);
    fetchCompanies();
  }, []);

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

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/companies', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCompanies(prev => [...prev, data.data]);
        
        // Log activity
        addActivity({
          action: 'created',
          entity: 'company',
          entityId: data.data._id,
          entityName: data.data.name,
          details: `${data.data.industry} • ${data.data.location}`
        });
        
        // Add notification
        addNotification({
          type: 'success',
          title: 'Company Created',
          message: `Company "${data.data.name}" has been successfully created and added to the database.`
        });
        
        setFormData({
          name: '',
          industry: 'Technology',
          location: '',
          website: '',
          companySize: '1-50',
          description: ''
        });
        setIsAddModalOpen(false);
            toast.success('Company Added', {
              description: 'Company has been successfully added to the database.'
            });
      } else {
        addNotification({
          type: 'error',
          title: 'Company Creation Failed',
          message: data.message || 'Failed to create company. Please try again.'
        });
        toast.error('Error Adding Company', {
          description: data.message
        });
      }
    } catch (error) {
      console.error('Error adding company:', error);
      addNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Unable to connect to the server. Please check your connection and try again.'
      });
      toast.error('Network Error', {
        description: 'Unable to connect to the server. Please check your connection.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCompany = (company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      industry: company.industry,
      location: company.location,
      website: company.website,
      companySize: company.companySize,
      description: company.description
    });
    setIsAddModalOpen(true);
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/companies/${editingCompany._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCompanies(prev => prev.map(company => 
          company._id === editingCompany._id ? data.data : company
        ));
        
        // Add notification
        addNotification({
          type: 'success',
          title: 'Company Updated',
          message: `Company "${data.data.name}" information has been successfully updated.`
        });
        
        setFormData({
          name: '',
          industry: 'Technology',
          location: '',
          website: '',
          companySize: '1-50',
          description: ''
        });
        setEditingCompany(null);
        setIsAddModalOpen(false);
            toast.success('Company Updated', {
              description: 'Company information has been successfully updated.'
            });
      } else {
        addNotification({
          type: 'error',
          title: 'Company Update Failed',
          message: data.message || 'Failed to update company. Please try again.'
        });
        toast.error('Error Updating Company', {
          description: data.message
        });
      }
    } catch (error) {
      console.error('Error updating company:', error);
      addNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Unable to connect to the server. Please check your connection and try again.'
      });
      toast.error('Network Error', {
        description: 'Unable to connect to the server. Please check your connection.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingCompany(null);
    setFormData({
      name: '',
      industry: 'Technology',
      location: '',
      website: '',
      companySize: '1-50',
      description: ''
    });
  };

  const handleDeleteCompany = (company) => {
    setCompanyToDelete(company);
    setIsConfirmationModalOpen(true);
  };

  const confirmDeleteCompany = async () => {
    if (!companyToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      console.log('Deleting company:', companyToDelete.name, 'with ID:', companyToDelete._id);
      console.log('Using token:', token ? 'Token exists' : 'No token');

      const response = await fetch(`http://localhost:5000/api/companies/${companyToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Delete response status:', response.status);
      const data = await response.json();
      console.log('Delete response data:', data);

      if (data.success) {
        setCompanies(prev => prev.filter(c => c._id !== companyToDelete._id));
        
        // Add notification
        addNotification({
          type: 'warning',
          title: 'Company Deleted',
          message: `Company "${companyToDelete.name}" has been permanently deleted from the database.`
        });
        
        toast.success('Company Deleted', {
          description: `${companyToDelete.name} has been successfully removed from the database.`
        });
        // Refresh the companies list to ensure sync with database
        fetchCompanies();
      } else {
        addNotification({
          type: 'error',
          title: 'Company Deletion Failed',
          message: data.message || 'Failed to delete company. Please try again.'
        });
        toast.error('Error Deleting Company', {
          description: data.message
        });
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      addNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Unable to connect to the server. Please check your connection and try again.'
      });
      toast.error('Network Error', {
        description: 'Unable to connect to the server. Please check your connection.'
      });
    } finally {
      setIsConfirmationModalOpen(false);
      setCompanyToDelete(null);
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


  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileUpload = (event) => {
    if (!isClient) return;
    
    const files = Array.from(event.target.files);
    const newFiles = files.map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      name: file.name,
      type: file.name.toLowerCase().includes('question') ? 'Question Paper' : 'Interview Report',
      uploadDate: new Date().toISOString().split('T')[0],
      size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      file: file
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDocumentUpload = async () => {
    if (uploadedFiles.length === 0) {
      toast.warning('No Files Selected', {
        description: 'Please select PDF files to upload.'
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      for (const fileData of uploadedFiles) {
        const formData = new FormData();
        formData.append('document', fileData.file);
        formData.append('type', fileData.type);

        const response = await fetch(`http://localhost:5000/api/companies/${selectedCompany._id}/documents`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const data = await response.json();
        
        if (!data.success) {
          toast.error('Upload Failed', {
            description: `Error uploading ${fileData.name}: ${data.message}`
          });
          return;
        }
      }

      // Refresh the companies list to show updated documents
      await fetchCompanies();
      
      toast.success('Documents Uploaded', {
        description: `${uploadedFiles.length} document(s) uploaded successfully!`
      });
      setIsDocumentModalOpen(false);
      setUploadedFiles([]);
      setSelectedCompany(null);
      
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error('Network Error', {
        description: 'Unable to connect to the server. Please check your connection.'
      });
    }
  };

  const handleDeleteDocument = (company, documentId) => {
    setDocumentToDeleteData({ company, documentId });
    setIsDocumentConfirmationModalOpen(true);
  };

  const confirmDeleteDocument = async () => {
    if (!documentToDeleteData) return;
    
    const { company, documentId } = documentToDeleteData;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/companies/${company._id}/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh the companies list to show updated documents
        await fetchCompanies();
        toast.success('Document Deleted', {
          description: 'Document has been successfully removed.'
        });
      } else {
        toast.error('Error Deleting Document', {
          description: data.message
        });
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Network Error', {
        description: 'Unable to connect to the server. Please check your connection.'
      });
    } finally {
      setIsDocumentConfirmationModalOpen(false);
      setDocumentToDeleteData(null);
    }
  };

  const openDocumentModal = (company) => {
    setSelectedCompany(company);
    setIsDocumentModalOpen(true);
  };

  const viewPdf = (document) => {
    setSelectedPdf(document);
    setIsPdfViewerOpen(true);
  };

  const removeDocument = (companyId, document) => {
    setDocumentToDelete({ companyId, document });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    // Here you would typically call your backend API to remove the document
    console.log(`Removing document ${documentToDelete.document.id} from company ${documentToDelete.companyId}`);
    
    // Close the modal and show success message
    setIsDeleteModalOpen(false);
    setDocumentToDelete(null);
    
    // Show success message (you could replace this with a toast notification)
    toast.success('Document Removed', {
      description: 'Document has been successfully removed from the list.'
    });
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setDocumentToDelete(null);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

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
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Companies Management</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Admin Panel</span>
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Companies</h1>
            <p className="text-slate-600 dark:text-gray-400">Manage company information and hiring details</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            + Add Company
          </button>
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
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700"
                />
              </div>
            </div>
            <div className="flex gap-2 relative z-10">
              <select className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 relative z-20 text-gray-900 dark:text-white font-medium">
                 <option className="text-gray-900 dark:text-white font-medium">All Industries</option>
                 <option className="text-gray-900 dark:text-white font-medium">Technology</option>
                 <option className="text-gray-900 dark:text-white font-medium">Finance</option>
                 <option className="text-gray-900 dark:text-white font-medium">Healthcare</option>
                 <option className="text-gray-900 dark:text-white font-medium">E-commerce</option>
               </select>
               <select className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 relative z-20 text-gray-900 dark:text-white font-medium">
                 <option className="text-gray-900 dark:text-white font-medium">All Sizes</option>
                 <option className="text-gray-900 dark:text-white font-medium">1-50</option>
                 <option className="text-gray-900 dark:text-white font-medium">51-200</option>
                 <option className="text-gray-900 dark:text-white font-medium">201-1000</option>
                 <option className="text-gray-900 dark:text-white font-medium">1000+</option>
               </select>
            </div>
          </div>
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
             <div key={company._id || company.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-2xl">
                    {company.logo || '🏢'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{company.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{company.industry}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditCompany(company)}
                    className="p-2 text-slate-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-colors"
                    title="Edit Company"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleDeleteCompany(company)}
                    className="p-2 text-slate-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                    title="Delete Company"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

               <div className="space-y-2 mb-4">
                 <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                   <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                   </svg>
                   {company.location}
                 </div>
                 <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                   <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                   </svg>
                   <a 
                     href={`https://${company.website}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
                   >
                     {company.website}
                   </a>
                 </div>
                 <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                   <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                   </svg>
                   {company.companySize || company.size} employees
                 </div>
               </div>

               <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{company.description}</p>

              {/* Documents Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Documents</h4>
                  <button
                    onClick={() => openDocumentModal(company)}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    + Add Documents
                  </button>
                </div>
                <div className="space-y-2">
                  {company.documents && company.documents.length > 0 ? (
                    company.documents.map((doc) => (
                       <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                          <div>
                             <p className="text-xs font-medium text-gray-900 dark:text-white">{doc.name}</p>
                             <p className="text-xs text-gray-500 dark:text-gray-400">{doc.type} • {doc.size}</p>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button 
                            onClick={() => viewPdf(doc)}
                            className="p-1 text-slate-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-colors"
                            title="View PDF"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDeleteDocument(company, doc.id)}
                            className="p-1 text-slate-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                            title="Delete PDF"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                     <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                       <svg className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                       </svg>
                       <p className="text-xs">No documents uploaded</p>
                     </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                 <div className="flex space-x-4 text-sm">
                   <span className="flex items-center text-gray-600">
                     <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                     {company.roles || company.jobRoles || 0} roles
                   </span>
                   <span className="flex items-center text-gray-600">
                     <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                     {company.workflows || 0} workflows
                   </span>
                   <span className="flex items-center text-gray-600">
                     <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                     {company.documents?.length || 0} docs
                   </span>
                 </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  company.hiringStatus === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {company.hiringStatus}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Add Company Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={handleCloseModal} />
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8 w-full max-w-2xl mx-auto z-10">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                {editingCompany ? 'Edit Company' : 'Add New Company'}
              </h2>
              
              <form className="space-y-6" onSubmit={editingCompany ? handleUpdateCompany : handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Company Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-700"
                      placeholder="Enter company name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Industry</label>
                    <select 
                      name="industry"
                      value={formData.industry}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 relative z-30 text-slate-900 dark:text-white font-medium"
                    >
                      <option className="text-slate-900 dark:text-white font-medium">Technology</option>
                      <option className="text-slate-900 dark:text-white font-medium">Finance</option>
                      <option className="text-slate-900 dark:text-white font-medium">Healthcare</option>
                      <option className="text-slate-900 dark:text-white font-medium">E-commerce</option>
                      <option className="text-slate-900 dark:text-white font-medium">Manufacturing</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-700"
                      placeholder="City, State"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-700"
                      placeholder="company.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Company Size</label>
                  <select 
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 relative z-30 text-slate-900 dark:text-white font-medium"
                  >
                    <option className="text-slate-900 dark:text-white font-medium">1-50</option>
                    <option className="text-slate-900 dark:text-white font-medium">51-200</option>
                    <option className="text-slate-900 dark:text-white font-medium">201-1000</option>
                    <option className="text-slate-900 dark:text-white font-medium">1000+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-700"
                    placeholder="Brief description of the company..."
                    required
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-3 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (editingCompany ? 'Updating...' : 'Adding...') : (editingCompany ? 'Update Company' : 'Add Company')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Document Upload Modal */}
        {isDocumentModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsDocumentModalOpen(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 w-full max-w-2xl mx-auto z-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Upload Documents - {selectedCompany?.name}
              </h2>
              
              <div className="space-y-6">
                {/* File Upload Area */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Upload PDF Documents
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                    <svg className="w-12 h-12 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-slate-600 mb-2">Drop PDF files here or click to browse</p>
                    <p className="text-sm text-slate-500 mb-4">Supports: Question Papers, Interview Reports</p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Choose Files
                    </label>
                  </div>
                </div>

                {/* Uploaded Files Preview */}
                {uploadedFiles.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Files to Upload</h3>
                    <div className="space-y-3">
                      {uploadedFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <p className="font-medium text-slate-900">{file.name}</p>
                              <p className="text-sm text-slate-500">{file.type} • {file.size}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setUploadedFiles(prev => prev.filter(f => f.id !== file.id))}
                            className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Document Types Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Document Types</h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span><strong>Question Papers:</strong> Previous year interview questions and technical assessments</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span><strong>Interview Reports:</strong> Detailed reports about hiring processes and experiences</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsDocumentModalOpen(false)}
                    className="px-6 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDocumentUpload}
                    disabled={uploadedFiles.length === 0}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold"
                  >
                    Upload {uploadedFiles.length} Document{uploadedFiles.length !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PDF Viewer Modal */}
        {isPdfViewerOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsPdfViewerOpen(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl mx-auto z-10 max-h-[90vh] overflow-hidden">
              {/* PDF Viewer Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedPdf?.name}</h2>
                    <p className="text-sm text-slate-600">{selectedPdf?.type} • {selectedPdf?.size}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPdfViewerOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* PDF Content Area */}
              <div className="p-6 h-[70vh] overflow-auto">
                <div className="bg-slate-50 rounded-lg p-8 text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">PDF Viewer</h3>
                  <p className="text-slate-600 mb-4">
                    This is a placeholder for the PDF viewer. In a real implementation, you would integrate a PDF viewer library like PDF.js or react-pdf.
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-slate-200 max-w-md mx-auto">
                    <h4 className="font-semibold text-slate-900 mb-2">Document Information:</h4>
                    <div className="text-sm text-slate-600 space-y-1">
                      <p><strong>Name:</strong> {selectedPdf?.name}</p>
                      <p><strong>Type:</strong> {selectedPdf?.type}</p>
                      <p><strong>Size:</strong> {selectedPdf?.size}</p>
                      <p><strong>Upload Date:</strong> {selectedPdf?.uploadDate}</p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-4">
                      Download PDF
                    </button>
                    <button className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                      Print PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={cancelDelete} />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 w-full max-w-md mx-auto z-10">
              {/* Warning Icon */}
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              {/* Modal Content */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Delete Document</h2>
                <p className="text-slate-600 mb-6">
                  Are you sure you want to delete this document? This action cannot be undone.
                </p>

                {/* Document Info */}
                {documentToDelete && (
                  <div className="bg-slate-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-3">
                      <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                      <div className="text-left">
                        <p className="font-medium text-slate-900">{documentToDelete.document.name}</p>
                        <p className="text-sm text-slate-500">{documentToDelete.document.type} • {documentToDelete.document.size}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={cancelDelete}
                    className="flex-1 px-6 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                  >
                    Delete Document
                  </button>
                </div>
              </div>
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
        setCompanyToDelete(null);
      }}
      onConfirm={confirmDeleteCompany}
      title="Delete Company"
      message={`Are you sure you want to delete "${companyToDelete?.name}"? This action cannot be undone and will remove all associated data including job roles, workflows, and documents.`}
      confirmText="Delete Company"
      cancelText="Cancel"
      type="danger"
    />

    {/* Document Confirmation Modal */}
    <ConfirmationModal
      isOpen={isDocumentConfirmationModalOpen}
      onClose={() => {
        setIsDocumentConfirmationModalOpen(false);
        setDocumentToDeleteData(null);
      }}
      onConfirm={confirmDeleteDocument}
      title="Delete Document"
      message="Are you sure you want to delete this document? This action cannot be undone."
      confirmText="Delete Document"
      cancelText="Cancel"
      type="danger"
    />
    </AdminProtection>
  );
}

