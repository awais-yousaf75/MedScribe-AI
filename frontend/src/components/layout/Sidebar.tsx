import { Activity, LayoutDashboard, Users, Building2, FileText, Settings, LogOut, UserCog, Stethoscope, UserPlus } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  userRole: 'doctor' | 'super_admin' | 'hospital_admin' | 'doctor_assistant';
  userName: string;
  userSubtitle: string;
}

export default function Sidebar({ currentPage, onNavigate, onLogout, userRole, userName, userSubtitle }: SidebarProps) {
  const getMenuItems = () => {
    switch (userRole) {
      case 'doctor':
        return [
          { id: 'doctor-dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'recording', label: 'New Consultation', icon: Stethoscope },
          { id: 'history', label: 'History', icon: FileText },
          { id: 'settings', label: 'Settings', icon: Settings },
        ];
      case 'super_admin':
        return [
          { id: 'super-admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'all-users', label: 'All Users', icon: Users },
          { id: 'all-hospitals', label: 'All Hospitals', icon: Building2 },
          { id: 'settings', label: 'Settings', icon: Settings },
        ];
      case 'hospital_admin':
        return [
          { id: 'hospital-admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'pending-doctors', label: 'Pending Doctors', icon: UserCog },
          { id: 'pending-assistants', label: 'Pending Assistants', icon: UserPlus },
          { id: 'settings', label: 'Settings', icon: Settings },
        ];
      case 'doctor_assistant':
        return [
          { id: 'assistant-dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'patients', label: 'Patients', icon: Users },
          { id: 'settings', label: 'Settings', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="w-64 h-screen bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 flex flex-col fixed left-0 top-0 shadow-lg">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center shadow-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold gradient-text">MedScribe AI</h1>
            <p className="text-xs text-muted-foreground">Clinical Platform</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-teal-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center text-white text-sm shadow-md">
            {userName.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{userSubtitle}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all shadow-premium-hover ${
                isActive
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#14B8A6] text-white shadow-lg scale-105'
                  : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-teal-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all shadow-premium-hover"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}