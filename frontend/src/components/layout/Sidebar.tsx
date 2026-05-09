// import {
//   Activity,
//   LayoutDashboard,
//   Users,
//   Building2,
//   FileText,
//   Settings,
//   LogOut,
//   UserCog,
//   Stethoscope,
//   UserPlus,
// } from 'lucide-react';

// interface SidebarProps {
//   currentPage: string;
//   onNavigate: (page: string) => void;
//   onLogout: () => void;
//   userRole: 'doctor' | 'super_admin' | 'hospital_admin' | 'doctor_assistant';
//   userName: string;
//   userSubtitle: string;
// }

// export default function Sidebar({
//   currentPage,
//   onNavigate,
//   onLogout,
//   userRole,
//   userName,
//   userSubtitle,
// }: SidebarProps) {
//   const getMenuItems = () => {
//     switch (userRole) {
//       case 'doctor':
//         return [
//           { id: 'doctor-dashboard', label: 'Dashboard', icon: LayoutDashboard },
//           { id: 'recording', label: 'New Consultation', icon: Stethoscope },
//           { id: 'history', label: 'History', icon: FileText },
//           { id: 'settings', label: 'Settings', icon: Settings },
//         ];
//       case 'super_admin':
//         return [
//           { id: 'super-admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
//           { id: 'all-users', label: 'All Users', icon: Users },
//           { id: 'all-hospitals', label: 'All Hospitals', icon: Building2 },
//           { id: 'settings', label: 'Settings', icon: Settings },
//         ];
//       case 'hospital_admin':
//         return [
//           { id: 'hospital-admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
//           { id: 'pending-doctors', label: 'Pending Doctors', icon: UserCog },
//           { id: 'pending-assistants', label: 'Pending Assistants', icon: UserPlus },
//           { id: 'settings', label: 'Settings', icon: Settings },
//         ];
//       case 'doctor_assistant':
//         return [
//           { id: 'assistant-dashboard', label: 'Dashboard', icon: LayoutDashboard },
//           { id: 'patients', label: 'Patients', icon: Users },
//           { id: 'settings', label: 'Settings', icon: Settings },
//         ];
//       default:
//         return [];
//     }
//   };

//   const menuItems = getMenuItems();

//   const initials = userName
//     .split(' ')
//     .map((n) => n[0])
//     .join('')
//     .toUpperCase()
//     .substring(0, 2);

//   return (
//     <aside className="sidebar">

//       {/* ── Logo ── */}
//       <div className="sidebar-logo">
//         <div className="sidebar-logo-icon">
//           <Activity size={18} color="#fff" />
//         </div>
//         <div>
//           <div className="sidebar-logo-text">MedScribe AI</div>
//           <div className="sidebar-logo-sub">Clinical Intelligence</div>
//         </div>
//       </div>

//       {/* ── User ── */}
//       <div className="sidebar-user">
//         <div className="sidebar-avatar">{initials}</div>
//         <div style={{ flex: 1, minWidth: 0 }}>
//           <div className="sidebar-user-name">{userName}</div>
//           <div className="sidebar-user-role">{userSubtitle}</div>
//         </div>
//       </div>

//       {/* ── Navigation ── */}
//       <nav className="sidebar-nav">
//         {menuItems.map((item) => {
//           const Icon = item.icon;
//           const isActive = currentPage === item.id;
//           return (
//             <button
//               key={item.id}
//               type="button"
//               onClick={() => onNavigate(item.id)}
//               className={`sidebar-nav-item${isActive ? ' sidebar-nav-item-active' : ''}`}
//             >
//               <Icon className="sidebar-nav-icon" />
//               <span className="sidebar-nav-label">{item.label}</span>
//               {isActive && <div className="sidebar-nav-indicator" />}
//             </button>
//           );
//         })}
//       </nav>

//       {/* ── Footer ── */}
//       <div className="sidebar-footer">
//         <button type="button" className="sidebar-logout" onClick={onLogout}>
//           <LogOut className="sidebar-logout-icon" />
//           <span>Sign Out</span>
//         </button>

//         <div className="sidebar-ornament" aria-hidden="true">
//           <span className="sidebar-ornament-line" />
//           <span className="sidebar-ornament-dot" />
//           <span className="sidebar-ornament-line" />
//         </div>
//       </div>
//     </aside>
//   );
// }