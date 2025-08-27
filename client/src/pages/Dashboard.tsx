import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { 
  KeyIcon, 
  FolderIcon, 
  TagIcon, 
  PlusIcon,
  ShieldCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { credentialsAPI } from '../services/api';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalCredentials: number;
  totalFolders: number;
  totalTags: number;
  weakPasswords: number;
  expiredPasswords: number;
  recentActivity: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalCredentials: 0,
    totalFolders: 0,
    totalTags: 0,
    weakPasswords: 0,
    expiredPasswords: 0,
    recentActivity: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await credentialsAPI.getStats();
        setStats(response.data);
      } catch (error) {
        toast.error('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getSecurityScore = () => {
    const total = stats.totalCredentials;
    if (total === 0) return 100;
    
    const weak = stats.weakPasswords;
    const expired = stats.expiredPasswords;
    const score = Math.max(0, 100 - ((weak + expired) / total) * 100);
    
    if (score >= 80) return { score: Math.round(score), color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 60) return { score: Math.round(score), color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { score: Math.round(score), color: 'text-red-600', bg: 'bg-red-100' };
  };

  const securityScore = getSecurityScore();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back, {user?.email}. Here's an overview of your password security.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <KeyIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Credentials</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCredentials}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FolderIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Folders</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalFolders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TagIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Tags</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalTags}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Security Score</p>
              <div className={`text-2xl font-semibold ${securityScore.color}`}>
                {securityScore.score}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Alerts */}
      {(stats.weakPasswords > 0 || stats.expiredPasswords > 0) && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Security Alerts</h3>
          </div>
          <div className="p-6 space-y-4">
            {stats.weakPasswords > 0 && (
              <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-md">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">
                    {stats.weakPasswords} weak password{stats.weakPasswords > 1 ? 's' : ''} detected
                  </p>
                  <p className="text-sm text-red-700">
                    Consider updating these passwords to improve your security.
                  </p>
                </div>
                <Link
                  to="/credentials?filter=weak"
                  className="ml-auto text-sm font-medium text-red-600 hover:text-red-500"
                >
                  Review →
                </Link>
              </div>
            )}

            {stats.expiredPasswords > 0 && (
              <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <ClockIcon className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-800">
                    {stats.expiredPasswords} password{stats.expiredPasswords > 1 ? 's' : ''} expired
                  </p>
                  <p className="text-sm text-yellow-700">
                    These passwords should be updated according to your security policy.
                  </p>
                </div>
                <Link
                  to="/credentials?filter=expired"
                  className="ml-auto text-sm font-medium text-yellow-600 hover:text-yellow-500"
                >
                  Review →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6 space-y-4">
            <Link
              to="/credentials/new"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <PlusIcon className="h-6 w-6 text-primary-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Add New Credential</p>
                <p className="text-sm text-gray-500">Store a new password or account</p>
              </div>
            </Link>

            <Link
              to="/folders/new"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FolderIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Create Folder</p>
                <p className="text-sm text-gray-500">Organize your credentials</p>
              </div>
            </Link>

            <Link
              to="/settings/security"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Security Settings</p>
                <p className="text-sm text-gray-500">Configure 2FA and security options</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            {stats.recentActivity > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  <span>Last login: {new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <ClockIcon className="h-4 w-4 text-blue-500 mr-2" />
                  <span>{stats.recentActivity} recent changes</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No recent activity</p>
                <p className="text-sm text-gray-400">Start by adding your first credential</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <ShieldCheckIcon className="h-6 w-6 text-blue-400" />
          <div className="ml-3">
            <h3 className="text-lg font-medium text-blue-800">Security Tips</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Use unique, strong passwords for each account</li>
                <li>Enable two-factor authentication where available</li>
                <li>Regularly review and update your passwords</li>
                <li>Never share your master password with anyone</li>
                <li>Keep your devices and browsers updated</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
