import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, User, Building2, Lock, Mail, Phone, Camera, LayoutDashboard, History, Settings as SettingsIcon, LogOut, Moon, Sun } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';

interface SettingsPageProps {
  onLogout: () => void;
}

export default function SettingsPage({ onLogout }: SettingsPageProps) {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [profile, setProfile] = useState({
    fullName: 'Dr. Ahmed Hassan',
    email: 'ahmed.hassan@citymedical.com',
    phone: '+1 (555) 123-4567',
    specialty: 'Internal Medicine',
    license: 'MD-45678',
    clinic: 'City Medical Center',
    address: '123 Medical Plaza, Healthcare District',
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    consultationReminders: true,
    aiUpdates: true,
  });

  const handleProfileChange = (field: string, value: string) => {
    setProfile({ ...profile, [field]: value });
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    setNotifications({ ...notifications, [field]: value });
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-[1400px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">MedScribe AI</h1>
              <p className="text-xs text-muted-foreground">Clinical Intelligence Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/doctor/dashboard')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-sm">Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/doctor/history')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
            >
              <History className="w-4 h-4" />
              <span className="text-sm">History</span>
            </button>
            <button
              onClick={() => navigate('/doctor/settings')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-[#2563EB]"
            >
              <SettingsIcon className="w-4 h-4" />
              <span className="text-sm">Settings</span>
            </button>
            <div className="h-8 w-px bg-gray-200" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm">Dr. Ahmed Hassan</p>
                <p className="text-xs text-muted-foreground">Internal Medicine</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center text-white">
                AH
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto p-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="space-y-2">
            <h2 className="text-3xl">Profile & Settings — MedScribe AI</h2>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Settings */}
            <div className="lg:col-span-2 space-y-8">
              {/* Profile Information */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <User className="w-6 h-6 text-[#2563EB]" />
                  </div>
                  <div>
                    <h3 className="text-xl">Profile Information</h3>
                    <p className="text-sm text-muted-foreground">Update your personal details</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={profile.fullName}
                      onChange={(e) => handleProfileChange('fullName', e.target.value)}
                      className="h-11 bg-gray-50 border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Specialty</Label>
                    <Input
                      id="specialty"
                      value={profile.specialty}
                      onChange={(e) => handleProfileChange('specialty', e.target.value)}
                      className="h-11 bg-gray-50 border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      className="h-11 bg-gray-50 border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      className="h-11 bg-gray-50 border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license">Medical License</Label>
                    <Input
                      id="license"
                      value={profile.license}
                      onChange={(e) => handleProfileChange('license', e.target.value)}
                      className="h-11 bg-gray-50 border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinic">Clinic / Hospital</Label>
                    <Input
                      id="clinic"
                      value={profile.clinic}
                      onChange={(e) => handleProfileChange('clinic', e.target.value)}
                      className="h-11 bg-gray-50 border-2"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Clinic Address</Label>
                  <Input
                    id="address"
                    value={profile.address}
                    onChange={(e) => handleProfileChange('address', e.target.value)}
                    className="h-11 bg-gray-50 border-2"
                  />
                </div>
              </div>

              {/* Security Settings */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-[#6366F1]" />
                  </div>
                  <div>
                    <h3 className="text-xl">Security Settings</h3>
                    <p className="text-sm text-muted-foreground">Manage your password and security</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="Enter current password"
                      className="h-11 bg-gray-50 border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      className="h-11 bg-gray-50 border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      className="h-11 bg-gray-50 border-2"
                    />
                  </div>
                  <Button variant="outline" className="w-full h-11 rounded-xl">
                    Update Password
                  </Button>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-[#14B8A6]" />
                  </div>
                  <div>
                    <h3 className="text-xl">Notification Preferences</h3>
                    <p className="text-sm text-muted-foreground">Choose how you receive updates</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive updates via text message</p>
                    </div>
                    <Switch
                      checked={notifications.sms}
                      onCheckedChange={(checked) => handleNotificationChange('sms', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium">Consultation Reminders</p>
                      <p className="text-sm text-muted-foreground">Get reminders for scheduled consultations</p>
                    </div>
                    <Switch
                      checked={notifications.consultationReminders}
                      onCheckedChange={(checked) => handleNotificationChange('consultationReminders', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium">AI Updates</p>
                      <p className="text-sm text-muted-foreground">Notifications about AI improvements</p>
                    </div>
                    <Switch
                      checked={notifications.aiUpdates}
                      onCheckedChange={(checked) => handleNotificationChange('aiUpdates', checked)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Profile Picture */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                <h3 className="text-lg">Profile Picture</h3>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center text-white text-3xl">
                    AH
                  </div>
                  <Button variant="outline" className="w-full h-11 rounded-xl">
                    <Camera className="w-4 h-4 mr-2" />
                    Upload Photo
                  </Button>
                </div>
              </div>

              {/* Clinic Logo */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                <h3 className="text-lg">Clinic Logo</h3>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-gray-400" />
                  </div>
                  <Button variant="outline" className="w-full h-11 rounded-xl">
                    <Camera className="w-4 h-4 mr-2" />
                    Upload Logo
                  </Button>
                </div>
              </div>

              {/* Theme Toggle */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                <h3 className="text-lg">Appearance</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      theme === 'light'
                        ? 'border-[#2563EB] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Sun className="w-5 h-5" />
                      <span>Light Mode</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      theme === 'dark'
                        ? 'border-[#2563EB] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Moon className="w-5 h-5" />
                      <span>Dark Mode</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Save Changes Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => alert('Settings saved!')}
              className="px-8 h-12 bg-gradient-to-r from-[#2563EB] to-[#14B8A6] hover:opacity-90"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
