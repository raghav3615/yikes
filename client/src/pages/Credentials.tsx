import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  FolderIcon,
  TagIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { credentialsAPI } from '../services/api';
import toast from 'react-hot-toast';

interface Credential {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  folderId?: string;
  folderName?: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

const Credentials: React.FC = () => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const response = await credentialsAPI.getAll();
      setCredentials(response.data);
    } catch (error) {
      toast.error('Failed to load credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchCredentials();
      return;
    }

    try {
      setLoading(true);
      const response = await credentialsAPI.search({ query: searchTerm });
      setCredentials(response.data);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (filterType: string) => {
    setFilter(filterType);
    // In a real app, you'd filter the credentials based on the filter type
    // For now, we'll just show all credentials
    fetchCredentials();
  };

  const togglePasswordVisibility = (credentialId: string) => {
    setShowPassword(prev => ({
      ...prev,
      [credentialId]: !prev[credentialId]
    }));
  };

  const toggleFavorite = async (credentialId: string) => {
    try {
      await credentialsAPI.toggleFavorite(credentialId);
      setCredentials(prev => 
        prev.map(cred => 
          cred.id === credentialId 
            ? { ...cred, isFavorite: !cred.isFavorite }
            : cred
        )
      );
      toast.success('Favorite updated');
    } catch (error) {
      toast.error('Failed to update favorite');
    }
  };

  const handleDelete = async () => {
    if (!selectedCredential) return;

    try {
      await credentialsAPI.delete(selectedCredential.id);
      setCredentials(prev => prev.filter(cred => cred.id !== selectedCredential.id));
      toast.success('Credential deleted');
      setShowDeleteModal(false);
      setSelectedCredential(null);
    } catch (error) {
      toast.error('Failed to delete credential');
    }
  };

  const filteredCredentials = credentials.filter(credential => {
    if (filter === 'favorites' && !credential.isFavorite) return false;
    if (filter === 'recent') {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 7);
      return new Date(credential.updatedAt) > recentDate;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Credentials</h1>
          <p className="mt-2 text-gray-600">
            Manage your stored passwords and account information
          </p>
        </div>
        <Link
          to="/credentials/new"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Credential
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search credentials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => handleFilter('all')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                filter === 'all'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilter('favorites')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                filter === 'favorites'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              Favorites
            </button>
            <button
              onClick={() => handleFilter('recent')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                filter === 'recent'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              Recent
            </button>
          </div>
        </div>
      </div>

      {/* Credentials Grid */}
      {filteredCredentials.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No credentials found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first credential'}
          </p>
          {!searchTerm && (
            <Link
              to="/credentials/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Credential
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCredentials.map((credential) => (
            <div
              key={credential.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {credential.title}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {credential.username}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleFavorite(credential.id)}
                    className="ml-2 text-gray-400 hover:text-yellow-500 transition-colors"
                  >
                    {credential.isFavorite ? (
                      <StarIconSolid className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <StarIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* URL */}
                {credential.url && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">URL</p>
                    <a
                      href={credential.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:text-primary-500 truncate block"
                    >
                      {credential.url}
                    </a>
                  </div>
                )}

                {/* Password */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Password</p>
                  <div className="flex items-center">
                    <input
                      type={showPassword[credential.id] ? 'text' : 'password'}
                      value={credential.password}
                      readOnly
                      className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded px-2 py-1 font-mono"
                    />
                    <button
                      onClick={() => togglePasswordVisibility(credential.id)}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword[credential.id] ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  {credential.folderName && (
                    <div className="flex items-center">
                      <FolderIcon className="h-3 w-3 mr-1" />
                      {credential.folderName}
                    </div>
                  )}
                  <div className="flex items-center">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    {new Date(credential.updatedAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Tags */}
                {credential.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {credential.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          <TagIcon className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                      {credential.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{credential.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <Link
                    to={`/credentials/${credential.id}/edit`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
                  <button
                    onClick={() => {
                      setSelectedCredential(credential);
                      setShowDeleteModal(true);
                    }}
                    className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Credential</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{selectedCredential?.title}"? This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center justify-center gap-4 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Credentials;
