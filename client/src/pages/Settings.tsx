import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { 
  UserIcon, 
  ShieldCheckIcon, 
  BellIcon, 
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface SettingsProps {}

const Settings: React.FC<SettingsProps> = () => {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [showConfirmMasterPassword, setShowConfirmMasterPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({
    email: user?.email || '',
    displayName: user?.displayName || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [masterPasswordForm, setMasterPasswordForm] = useState({
    currentMasterPassword: '',
    newMasterPassword: '',
    confirmMasterPassword: ''
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    autoLock: true,
    passwordHistory: 5,
    requireMasterPassword: true
  });

  const [notificationSettings, setNotificationSettings] = useState({
    securityAlerts: true,
    passwordExpiry: true,
    loginAttempts: true,
    weeklyReports: false
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Implement profile update API call
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    try {
      // TODO: Implement password change API call
      toast.success('Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error('Failed to change password');
    }
  };

  const handleMasterPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (masterPasswordForm.newMasterPassword !== masterPasswordForm.confirmMasterPassword) {
      toast.error('New master passwords do not match');
      return;
    }
    try {
      // TODO: Implement master password change API call
      toast.success('Master password changed successfully');
      setMasterPasswordForm({
        currentMasterPassword: '',
        newMasterPassword: '',
        confirmMasterPassword: ''
      });
    } catch (error) {
      toast.error('Failed to change master password');
    }
  };

  const handleSecuritySettingChange = (setting: string, value: any) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleNotificationSettingChange = (setting: string, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'advanced', name: 'Advanced', icon: KeyIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5 inline mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Profile Information</h3>
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                  Display Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  value={profileForm.displayName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, displayName: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="p-6 space-y-8">
            {/* Password Change */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      id="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="block w-full pr-10 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showCurrentPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="newPassword"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="block w-full pr-10 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showNewPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="block w-full pr-10 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Change Password
                  </button>
                </div>
              </form>
            </div>

            {/* Master Password Change */}
            <div className="border-t pt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Change Master Password</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Changing your master password will require you to re-encrypt all your stored credentials. 
                        Make sure you remember the new master password, as it cannot be recovered.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <form onSubmit={handleMasterPasswordChange} className="space-y-4">
                <div>
                  <label htmlFor="currentMasterPassword" className="block text-sm font-medium text-gray-700">
                    Current Master Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={showMasterPassword ? 'text' : 'password'}
                      id="currentMasterPassword"
                      value={masterPasswordForm.currentMasterPassword}
                      onChange={(e) => setMasterPasswordForm(prev => ({ ...prev, currentMasterPassword: e.target.value }))}
                      className="block w-full pr-10 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowMasterPassword(!showMasterPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showMasterPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="newMasterPassword" className="block text-sm font-medium text-gray-700">
                    New Master Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={showConfirmMasterPassword ? 'text' : 'password'}
                      id="newMasterPassword"
                      value={masterPasswordForm.newMasterPassword}
                      onChange={(e) => setMasterPasswordForm(prev => ({ ...prev, newMasterPassword: e.target.value }))}
                      className="block w-full pr-10 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmMasterPassword(!showConfirmMasterPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmMasterPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmMasterPassword" className="block text-sm font-medium text-gray-700">
                    Confirm New Master Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={showConfirmMasterPassword ? 'text' : 'password'}
                      id="confirmMasterPassword"
                      value={masterPasswordForm.confirmMasterPassword}
                      onChange={(e) => setMasterPasswordForm(prev => ({ ...prev, confirmMasterPassword: e.target.value }))}
                      className="block w-full pr-10 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmMasterPassword(!showConfirmMasterPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmMasterPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    Change Master Password
                  </button>
                </div>
              </form>
            </div>

            {/* Security Preferences */}
            <div className="border-t pt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Security Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <button
                    onClick={() => handleSecuritySettingChange('twoFactorEnabled', !securitySettings.twoFactorEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      securitySettings.twoFactorEnabled ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        securitySettings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Auto-lock on inactivity</p>
                    <p className="text-sm text-gray-500">Automatically lock your vault after inactivity</p>
                  </div>
                  <button
                    onClick={() => handleSecuritySettingChange('autoLock', !securitySettings.autoLock)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      securitySettings.autoLock ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        securitySettings.autoLock ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Require master password for changes</p>
                    <p className="text-sm text-gray-500">Always require master password for sensitive operations</p>
                  </div>
                  <button
                    onClick={() => handleSecuritySettingChange('requireMasterPassword', !securitySettings.requireMasterPassword)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      securitySettings.requireMasterPassword ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        securitySettings.requireMasterPassword ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Notification Preferences</h3>
            <div className="space-y-4">
              {Object.entries(notificationSettings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </p>
                    <p className="text-sm text-gray-500">
                      Receive notifications for {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleNotificationSettingChange(key, !value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      value ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        value ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Settings</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-700">
                    Session Timeout (minutes)
                  </label>
                  <select
                    id="sessionTimeout"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => handleSecuritySettingChange('sessionTimeout', parseInt(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                    <option value={0}>Never (until logout)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="passwordHistory" className="block text-sm font-medium text-gray-700">
                    Password History Count
                  </label>
                  <select
                    id="passwordHistory"
                    value={securitySettings.passwordHistory}
                    onChange={(e) => handleSecuritySettingChange('passwordHistory', parseInt(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value={0}>No history</option>
                    <option value={3}>3 passwords</option>
                    <option value={5}>5 passwords</option>
                    <option value={10}>10 passwords</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Danger Zone</h4>
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Delete Account</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
