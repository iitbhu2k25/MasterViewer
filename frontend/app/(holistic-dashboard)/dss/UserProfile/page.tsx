'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Building2, Phone, MapPin, Edit3, Save, X, Camera, Shield, Key, Download, Trash2, CheckCircle, Globe } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  organisation: string;
  phone?: string;
  designation?: string;
  location?: string;
  department?: string;
  joinedDate: string;
  lastLogin: string;
  profileImage?: string;
  bio?: string;
  verified?: boolean;
}

const InputField = ({ label, value, onChange, type = 'text', placeholder, disabled = false, isEditing }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  isEditing: boolean;
}) => {
  const id = `profile-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="group">
      <label 
        htmlFor={isEditing && !disabled ? id : undefined}
        className="block text-sm font-bold text-gray-800 mb-3 group-focus-within:text-transparent group-focus-within:bg-gradient-to-r group-focus-within:from-blue-600 group-focus-within:to-purple-600 group-focus-within:bg-clip-text transition-all duration-300"
      >
        {label}
      </label>
      {isEditing && !disabled ? (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/90 backdrop-blur-sm focus:bg-white text-gray-900 placeholder-gray-500 font-medium shadow-sm focus:shadow-lg"
        />
      ) : (
        <div className="px-5 py-4 bg-gray-50 rounded-2xl text-gray-900 min-h-[56px] flex items-center border-2 border-transparent font-medium shadow-sm">
          {value || <span className="text-gray-500">Not specified</span>}
        </div>
      )}
    </div>
  );
};

const UserProfilePage: React.FC = () => {
  const [user, setUser] = useState<UserProfile>({
    id: 'usr_001',
    name: 'Dr. Rajesh Kumar',
    email: 'rajesh.kumar@jalshakti.gov.in',
    organisation: 'Ministry of Jal Shakti',
    phone: '+91 98765 43210',
    designation: 'Senior Water Resources Engineer',
    location: 'New Delhi, India',
    department: 'Groundwater Management Division',
    joinedDate: '2020-03-15',
    lastLogin: '2025-08-04T10:30:00Z',
    bio: 'Specialized in sustainable groundwater resource management and water conservation strategies with over 12 years of experience in hydrology and environmental engineering.',
    verified: true
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<UserProfile>(user);
  const [activeTab, setActiveTab] = useState('profile');
  const [imageUploadHover, setImageUploadHover] = useState(false);

  const handleSave = () => {
    setUser(editedUser);
    setIsEditing(false);
    console.log('User profile updated:', editedUser);
  };

  const handleCancel = () => {
    setEditedUser(user);
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setEditedUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditedUser(prev => ({
          ...prev,
          profileImage: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const TabButton = ({ tabId, label, icon }: { tabId: string; label: string; icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`group relative flex items-center gap-3 px-8 py-4 rounded-2xl transition-all duration-500 ${
        activeTab === tabId
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-2xl shadow-blue-500/30 transform scale-105'
          : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:text-gray-900 shadow-lg border border-white/50 hover:shadow-xl hover:scale-102'
      }`}
    >
      <div className={`transition-all duration-500 ${activeTab === tabId ? 'scale-110 drop-shadow-lg' : 'group-hover:scale-110'}`}>
        {icon}
      </div>
      <span className="font-semibold text-sm tracking-wide">{label}</span>
      {activeTab === tabId && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-30 -z-10"></div>
      )}
    </button>
  );

  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return date.toLocaleDateString('en-IN');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/50 to-purple-50/30 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/10 via-blue-400/10 to-indigo-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-8">
        {/* Header with Welcome Message */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl shadow-2xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-wide">
              Welcome, {user.name} 
            </h1>
            <p className="text-blue-100 text-lg">
              Manage your professional profile and account settings
            </p>
          </div>
        </div>

        {/* Page Title and Actions */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <h2 className="text-5xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  User Profile
                </h2>
                {user.verified && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-sm font-bold shadow-lg">
                    <CheckCircle size={16} />
                    Verified Account
                  </div>
                )}
              </div>
              <p className="text-gray-600 text-xl font-medium">Complete your professional information and secure your account</p>
            </div>
            <div className="flex items-center gap-4">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-500 transform hover:scale-105 font-semibold"
                >
                  <Edit3 size={20} className="group-hover:rotate-12 transition-transform duration-500" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl hover:shadow-2xl hover:shadow-green-500/40 transition-all duration-500 transform hover:scale-105 font-semibold"
                  >
                    <Save size={20} />
                    <span>Save Changes</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl hover:shadow-xl transition-all duration-300 font-semibold"
                  >
                    <X size={20} />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="flex gap-6 mb-10 overflow-x-auto pb-4">
          <TabButton tabId="profile" label="Profile Information" icon={<User size={22} />} />
          <TabButton tabId="security" label="Security & Privacy" icon={<Shield size={22} />} />
          <TabButton tabId="data" label="Data Management" icon={<Download size={22} />} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
          {/* Enhanced Profile Card */}
          <div className="xl:col-span-1">
            <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 p-13 sticky top-11">
              <div className="text-center">
                <div 
                  className="relative inline-block mb-8"
                  onMouseEnter={() => setImageUploadHover(true)}
                  onMouseLeave={() => setImageUploadHover(false)}
                >
                  <div className="relative w-36 h-36 mx-auto">
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-2xl ring-4 ring-white/50">
                      {editedUser.profileImage ? (
                        <img
                          src={editedUser.profileImage}
                          alt="Profile"
                          className="w-full h-full rounded-3xl object-cover"
                        />
                      ) : (
                        user.name.split(' ').map(n => n[0]).join('')
                      )}
                    </div>
                    {isEditing && (
                      <label className={`absolute inset-0 bg-black/60 rounded-3xl flex items-center justify-center cursor-pointer transition-all duration-300 ${
                        imageUploadHover ? 'opacity-100' : 'opacity-0'
                      }`}>
                        <Camera size={28} className="text-white drop-shadow-lg" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  {user.verified && (
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center ring-4 ring-white shadow-lg">
                      <CheckCircle size={20} className="text-white" />
                    </div>
                  )}
                </div>

                <h3 className="text-2xl font-black text-gray-900 mb-3">{user.name}</h3>
                <p className="text-blue-600 font-bold text-lg mb-2">{user.designation}</p>
                <p className="text-gray-700 font-medium mb-8">{user.organisation}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-100">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail size={18} className="text-white" />
                  </div>
                  <span className="text-gray-800 font-medium text-sm break-all">{user.email}</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl border border-green-100">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone size={18} className="text-white" />
                  </div>
                  <span className="text-gray-800 font-medium text-sm">{user.phone}</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border border-orange-100">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin size={18} className="text-white" />
                  </div>
                  <span className="text-gray-800 font-medium text-sm">{user.location}</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse shadow-lg"></div>
                    <span className="text-sm font-bold text-green-600">Online Now</span>
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {formatLastLogin(user.lastLogin)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Main Content */}
          <div className="xl:col-span-3">
            <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 p-10">
              {activeTab === 'profile' && (
                <div className="space-y-10">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <User size={24} className="text-white" />
                    </div>
                    <h3 className="text-3xl font-black bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">Personal Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <InputField
                      label="Full Name"
                      value={editedUser.name}
                      onChange={(value) => handleInputChange('name', value)}
                      placeholder="Enter your full name"
                      isEditing={isEditing}
                    />

                    <InputField
                      label="Email Address"
                      value={editedUser.email}
                      onChange={(value) => handleInputChange('email', value)}
                      type="email"
                      placeholder="Enter your email address"
                      isEditing={isEditing}
                    />

                    <InputField
                      label="Organisation"
                      value={editedUser.organisation}
                      onChange={(value) => handleInputChange('organisation', value)}
                      placeholder="Enter your organisation"
                      isEditing={isEditing}
                    />

                    <InputField
                      label="Phone Number"
                      value={editedUser.phone || ''}
                      onChange={(value) => handleInputChange('phone', value)}
                      type="tel"
                      placeholder="Enter your phone number"
                      isEditing={isEditing}
                    />

                    <InputField
                      label="Designation"
                      value={editedUser.designation || ''}
                      onChange={(value) => handleInputChange('designation', value)}
                      placeholder="Enter your designation"
                      isEditing={isEditing}
                    />

                    <InputField
                      label="Department"
                      value={editedUser.department || ''}
                      onChange={(value) => handleInputChange('department', value)}
                      placeholder="Enter your department"
                      isEditing={isEditing}
                    />
                  </div>

                  <InputField
                    label="Location"
                    value={editedUser.location || ''}
                    onChange={(value) => handleInputChange('location', value)}
                    placeholder="Enter your location"
                    isEditing={isEditing}
                  />

                  <div className="group">
                    <label 
                      htmlFor={isEditing ? 'profile-professional-bio' : undefined}
                      className="block text-sm font-bold text-gray-800 mb-3 group-focus-within:text-transparent group-focus-within:bg-gradient-to-r group-focus-within:from-blue-600 group-focus-within:to-purple-600 group-focus-within:bg-clip-text transition-all duration-300"
                    >
                      Professional Bio
                    </label>
                    {isEditing ? (
                      <textarea
                        id="profile-professional-bio"
                        value={editedUser.bio || ''}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        rows={5}
                        className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/90 backdrop-blur-sm focus:bg-white text-gray-900 placeholder-gray-500 resize-none font-medium shadow-sm focus:shadow-lg"
                        placeholder="Tell us about your professional background, expertise, and achievements..."
                      />
                    ) : (
                      <div className="px-5 py-4 bg-gray-50 rounded-2xl text-gray-900 min-h-[120px] border-2 border-transparent font-medium shadow-sm">
                        {user.bio || <span className="text-gray-500">No professional bio provided</span>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-10">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Shield size={24} className="text-white" />
                    </div>
                    <h3 className="text-3xl font-black bg-gradient-to-r from-gray-900 to-green-800 bg-clip-text text-transparent">Security & Privacy</h3>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="group p-8 border-2 border-gray-200 rounded-3xl hover:shadow-2xl hover:border-blue-300 transition-all duration-500 bg-gradient-to-r from-blue-50/50 to-cyan-50/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl">
                            <Key size={24} className="text-white" />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 mb-1">Password Security</h4>
                            <p className="text-gray-600 font-medium">Update your account password</p>
                          </div>
                        </div>
                        <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 font-bold transform hover:scale-105">
                          Change Password
                        </button>
                      </div>
                    </div>

                    <div className="group p-8 border-2 border-gray-200 rounded-3xl hover:shadow-2xl hover:border-purple-300 transition-all duration-500 bg-gradient-to-r from-purple-50/50 to-pink-50/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
                            <Globe size={24} className="text-white" />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 mb-1">Active Sessions</h4>
                            <p className="text-gray-600 font-medium">Manage your login sessions</p>
                          </div>
                        </div>
                        <button className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 font-bold transform hover:scale-105">
                          View Sessions
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'data' && (
                <div className="space-y-10">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Download size={24} className="text-white" />
                    </div>
                    <h3 className="text-3xl font-black bg-gradient-to-r from-gray-900 to-orange-800 bg-clip-text text-transparent">Data Management</h3>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="group p-8 border-2 border-gray-200 rounded-3xl hover:shadow-2xl hover:border-blue-300 transition-all duration-500 bg-gradient-to-r from-blue-50/50 to-cyan-50/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl">
                            <Download size={24} className="text-white" />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 mb-1">Export Profile Data</h4>
                            <p className="text-gray-600 font-medium">Download your complete profile information</p>
                          </div>
                        </div>
                        <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 font-bold transform hover:scale-105">
                          Download Data
                        </button>
                      </div>
                    </div>

                    <div className="group p-8 border-2 border-red-300 rounded-3xl bg-gradient-to-r from-red-50/80 to-pink-50/80 hover:shadow-2xl transition-all duration-500">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
                            <Trash2 size={24} className="text-white" />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-red-900 mb-1">Delete Account</h4>
                            <p className="text-red-700 font-medium">Permanently remove your account and all data</p>
                          </div>
                        </div>
                        <button className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 font-bold transform hover:scale-105">
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;