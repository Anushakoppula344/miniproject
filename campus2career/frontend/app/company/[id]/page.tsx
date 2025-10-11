'use client';

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import { useNotifications } from '../../../components/NotificationProvider';

interface Company {
  _id: string;
  name: string;
  industry: string;
  location: string;
  description: string;
  website: string;
  logo?: string;
  jobRoles?: JobRole[];
  documents?: Document[];
}

interface JobRole {
  _id: string;
  title: string;
  level: string;
  type: string;
  location: string;
  description?: string;
  salary: { min: number; max: number; currency: string } | string;
  requirements?: string[] | string;
  skills?: string[] | string;
  registrationLastDate: string;
  status: string;
}

interface Document {
  _id: string;
  id?: string;
  name: string;
  type: string;
  url: string;
  size: number | string;
  uploadDate?: string;
  uploadedAt?: string;
  description?: string;
  filename?: string;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (params.id) {
      fetchCompanyDetails(params.id as string);
    }
  }, [params.id]);

  const fetchCompanyDetails = async (companyId: string) => {
    try {
      setIsLoading(true);
      const response = await apiCall(`/api/companies/${companyId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Company details response:', data); // Debug log
        
        if (data.success && data.data) {
          setCompany(data.data);
          
          // Fetch documents and job roles for this company
          await Promise.all([
            fetchDocuments(companyId),
            fetchJobRoles(companyId)
          ]);
        } else {
          console.error('Invalid company response structure:', data);
          setCompany(null);
        }
      } else {
        console.error('Error fetching company details:', response.status, response.statusText);
        setCompany(null);
      }
    } catch (error) {
      console.error('Error fetching company details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDocuments = async (companyId: string) => {
    try {
      const response = await apiCall(`/api/companies/${companyId}/documents`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.data.documents || []);
      } else {
        console.error('Error fetching documents:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchJobRoles = async (companyId: string) => {
    try {
      // First get the company name to filter job roles
      const companyResponse = await apiCall(`/api/companies/${companyId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        console.log('Company data for job roles:', companyData); // Debug log
        
        // Check if the response has the expected structure
        if (companyData.success && companyData.data) {
          const companyName = companyData.data.name;
          console.log('Company name for filtering:', companyName); // Debug log

          // Fetch all job roles and filter by company name
          const response = await apiCall('/api/job-roles', {
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log('All job roles:', data); // Debug log
            
            if (data.success && data.data) {
              const companyJobRoles = data.data.filter((job: any) => 
                job.company && job.company.toLowerCase() === companyName.toLowerCase()
              );
              console.log('Filtered job roles for company:', companyJobRoles); // Debug log
              console.log('Total job roles found:', data.data.length); // Debug log
              console.log('Company name being filtered:', companyName); // Debug log
              
              setJobRoles(companyJobRoles);
            } else {
              console.error('Invalid job roles response structure:', data);
            }
          } else {
            console.error('Error fetching job roles:', response.status, response.statusText);
          }
        } else {
          console.error('Invalid company data structure:', companyData);
        }
      } else {
        console.error('Error fetching company data for job roles:', companyResponse.status, companyResponse.statusText);
      }
    } catch (error) {
      console.error('Error fetching job roles:', error);
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    console.log('Downloading document:', doc);
    setLoadingDocuments(prev => ({ ...prev, [`download-${doc.id || doc._id}`]: true }));
    try {
      // Use the real document download endpoint
      const downloadUrl = apiCall(`/api/companies/${params.id}/documents/${doc.id || doc._id}/download`);
      
      // Test if the endpoint is accessible first
      const response = await fetch(downloadUrl, { method: 'HEAD' });
      if (response.ok) {
        // Create a temporary link to trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = doc.name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Document downloaded successfully - use toast instead
        toast.success('Document Downloaded', {
          description: `Document "${doc.name}" has been downloaded successfully!`
        });
      } else {
        // Fallback: show a message that document is not available
        addNotification({
          type: 'warning',
          title: 'Document Not Available',
          message: `Document "${doc.name}" is not available for download at the moment. Please contact support.`
        });
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      addNotification({
        type: 'error',
        title: 'Download Failed',
        message: 'Failed to download document. Please try again later.'
      });
    } finally {
      setLoadingDocuments(prev => ({ ...prev, [`download-${doc.id || doc._id}`]: false }));
    }
  };

  const handleViewDocument = async (doc: Document) => {
    console.log('Viewing document:', doc);
    setLoadingDocuments(prev => ({ ...prev, [`view-${doc.id || doc._id}`]: true }));
    try {
      // Use the real document view endpoint
      const viewUrl = apiCall(`/api/companies/${params.id}/documents/${doc.id || doc._id}/view`);
      
      // Test if the endpoint is accessible first
      const response = await fetch(viewUrl, { method: 'HEAD' });
      if (response.ok) {
        // Open the document in a new tab for viewing
        window.open(viewUrl, '_blank');
        addNotification({
          type: 'success',
          title: 'Document Opened',
          message: `Document "${doc.name}" has been opened in a new tab!`
        });
      } else {
        // Fallback: show a message that document is not available
        addNotification({
          type: 'warning',
          title: 'Document Not Available',
          message: `Document "${doc.name}" is not available for viewing at the moment. Please try downloading it instead.`
        });
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      addNotification({
        type: 'error',
        title: 'View Failed',
        message: 'Failed to open document. Please try downloading it instead.'
      });
    } finally {
      setLoadingDocuments(prev => ({ ...prev, [`view-${doc.id || doc._id}`]: false }));
    }
  };


  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('doc')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📈';
    if (type.includes('image')) return '🖼️';
    return '📁';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Company Not Found</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">The company you're looking for doesn't exist or there was an error loading it.</p>
            <button
              onClick={() => router.push('/opportunities')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Back to Opportunities
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Company Header */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold text-2xl">
                  {company.name.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{company.name}</h1>
                <p className="text-lg text-slate-600 dark:text-slate-400">{company.industry}</p>
                <div className="flex items-center mt-2 text-sm text-slate-500 dark:text-slate-400">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {company.location}
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => window.open(company.website, '_blank')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Visit Website
              </button>
              <button
                onClick={() => router.push('/opportunities')}
                className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium py-2 px-4 rounded-md transition-colors"
              >
                Back to Opportunities
              </button>
            </div>
          </div>
          
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            {company.description || 'No description available for this company.'}
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
          <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'documents'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Documents ({documents.length})
              </button>
              <button
                onClick={() => setActiveTab('jobs')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'jobs'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Open Positions ({jobRoles.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Company Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white mb-2">Industry</h4>
                      <p className="text-slate-600 dark:text-slate-400">{company.industry}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white mb-2">Location</h4>
                      <p className="text-slate-600 dark:text-slate-400">{company.location}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white mb-2">Website</h4>
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {company.website}
                      </a>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white mb-2">Open Positions</h4>
                      <p className="text-slate-600 dark:text-slate-400">{jobRoles.length} positions available</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Company Documents</h3>
                {documents.length > 0 ? (
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <div key={doc._id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{getFileIcon(doc.type)}</span>
                            <div>
                              <h4 className="font-medium text-slate-900 dark:text-white">{doc.name}</h4>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {typeof doc.size === 'string' ? doc.size : formatFileSize(doc.size)} • {new Date(doc.uploadDate || doc.uploadedAt || '').toLocaleDateString()}
                              </p>
                              {doc.description && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{doc.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewDocument(doc)}
                              disabled={loadingDocuments[`view-${doc.id || doc._id}`]}
                              className={`px-3 py-1 rounded-md text-sm transition-colors flex items-center space-x-1 ${
                                loadingDocuments[`view-${doc.id || doc._id}`]
                                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                              }`}
                            >
                              {loadingDocuments[`view-${doc.id || doc._id}`] ? (
                                <>
                                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span>Opening...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  <span>View</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDownloadDocument(doc)}
                              disabled={loadingDocuments[`download-${doc.id || doc._id}`]}
                              className={`px-3 py-1 rounded-md text-sm transition-colors flex items-center space-x-1 ${
                                loadingDocuments[`download-${doc.id || doc._id}`]
                                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                              }`}
                            >
                              {loadingDocuments[`download-${doc.id || doc._id}`] ? (
                                <>
                                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span>Downloading...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span>Download</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📁</div>
                    <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Documents Available</h4>
                    <p className="text-slate-600 dark:text-slate-400">This company hasn't uploaded any documents yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'jobs' && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Open Positions</h3>
                {jobRoles && jobRoles.length > 0 ? (
                  <div className="space-y-4">
                    {jobRoles.map((job) => (
                      <div key={job._id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{job.title}</h4>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                                </svg>
                                {job.level}
                              </span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {job.type}
                              </span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {job.location}
                              </span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                {formatSalary(job.salary)}
                              </span>
                            </div>
                            {job.description && (
                              <p className="text-slate-700 dark:text-slate-300 mb-3">{job.description}</p>
                            )}
                            {job.requirements && (Array.isArray(job.requirements) ? job.requirements.length > 0 : job.requirements.length > 0) && (
                              <div className="mb-3">
                                <h5 className="font-medium text-slate-900 dark:text-white mb-1">Requirements:</h5>
                                {Array.isArray(job.requirements) ? (
                                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                    {job.requirements.map((req: string, index: number) => (
                                      <li key={index} className="flex items-start">
                                        <span className="text-slate-400 mr-2">•</span>
                                        {req}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                    {job.requirements.split(' ').map((req: string, index: number) => (
                                      <li key={index} className="flex items-start">
                                        <span className="text-slate-400 mr-2">•</span>
                                        {req}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              job.status === 'Active' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400'
                            }`}>
                              {job.status}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              Apply by: {new Date(job.registrationLastDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {job.skills && (Array.isArray(job.skills) ? job.skills.length > 0 : job.skills.length > 0) && (
                          <div>
                            <h5 className="font-medium text-slate-900 dark:text-white mb-2">Required Skills:</h5>
                            <div className="flex flex-wrap gap-2">
                              {(Array.isArray(job.skills) ? job.skills : job.skills.split(' ')).slice(0, 8).map((skill: string, index: number) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md text-sm">
                                  {skill}
                                </span>
                              ))}
                              {(Array.isArray(job.skills) ? job.skills : job.skills.split(' ')).length > 8 && (
                                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-sm">
                                  +{(Array.isArray(job.skills) ? job.skills : job.skills.split(' ')).length - 8} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                          <button 
                            onClick={() => {
                              addNotification({
                                type: 'info',
                                title: 'Redirecting to RGUKT Basar',
                                message: 'Opening RGUKT Basar website for job application...'
                              });
                              window.open('https://www.rgukt.ac.in/', '_blank');
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm cursor-pointer"
                          >
                            Apply Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">💼</div>
                    <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Open Positions</h4>
                    <p className="text-slate-600 dark:text-slate-400">This company doesn't have any open positions at the moment.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function for salary formatting
function formatSalary(salary: { min: number; max: number; currency: string } | string) {
  if (typeof salary === 'string') {
    // Handle string format like "@{min=800000; max=1200000; currency=INR}"
    const match = salary.match(/min=(\d+).*max=(\d+).*currency=(\w+)/);
    if (match) {
      const min = parseInt(match[1]);
      const max = parseInt(match[2]);
      const currency = match[3];
      return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    }
    return salary; // Return as-is if parsing fails
  }
  return `${salary.currency} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
}
