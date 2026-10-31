import React, { useState } from 'react';
import { User, Notification } from '../server/types.ts';
import {
  ShieldCheck,
  Bell,
  RotateCcw,
  UserCheck,
  ChevronDown,
  Building2,
  GraduationCap,
  Briefcase,
  ExternalLink,
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onSwitchPersona: (role: string, userId?: string) => void;
  onResetData: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
  notifications: Notification[];
  onMarkNotificationRead: (id: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSwitchPersona,
  onResetData,
  currentView,
  onNavigate,
  notifications,
  onMarkNotificationRead,
}) => {
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const personas = [
    {
      role: 'SUPER_ADMIN',
      name: 'Dr. Anil Sahasrabudhe',
      title: 'AICTE Super Admin',
      icon: ShieldCheck,
      color: 'text-sky-700 bg-sky-50',
    },
    {
      role: 'INSTITUTION_ADMIN',
      name: 'Prof. R. K. Deshmukh',
      title: 'Dean, COEP Pune',
      icon: Building2,
      color: 'text-teal-700 bg-teal-50',
    },
    {
      role: 'STUDENT',
      name: 'Aarav Sharma',
      title: 'B.Tech Student (COEP)',
      icon: GraduationCap,
      color: 'text-indigo-700 bg-indigo-50',
    },
    {
      role: 'VERIFIER',
      name: 'Priya Nair',
      title: 'TCS Background Verifier',
      icon: Briefcase,
      color: 'text-amber-700 bg-amber-50',
    },
  ];

  const getDashboardViewForRole = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'admin-dashboard';
      case 'INSTITUTION_ADMIN':
        return 'institution-dashboard';
      case 'STUDENT':
        return 'student-dashboard';
      case 'VERIFIER':
        return 'verifier-dashboard';
      default:
        return 'landing';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      {/* Top National Banner */}
      <div className="bg-slate-900 text-slate-300 px-4 sm:px-6 py-1 text-[11px] flex items-center justify-between font-medium">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-400"></span>
          <span>Government of India · Ministry of Education · AICTE Digital Infrastructure</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">APAAR Verhoeff Checksum Engine Active</span>
          <button
            onClick={onResetData}
            title="Reset database to fresh demo state"
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 text-left focus:outline-none"
          >
            <img
              src="/logo.png"
              alt="EduVerify National Logo"
              className="w-10 h-10 object-contain drop-shadow-sm rounded"
            />
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 block leading-none">
                EduVerify
              </span>
              <span className="text-[10px] tracking-wider text-slate-500 font-semibold uppercase block mt-0.5">
                APAAR National Registry
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
          <button
            onClick={() => onNavigate('landing')}
            className={`transition-colors whitespace-nowrap ${
              currentView === 'landing' ? 'text-sky-900 font-bold' : 'hover:text-slate-900'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate(getDashboardViewForRole(currentUser?.role))}
            className={`transition-colors whitespace-nowrap ${
              currentView.includes('dashboard') ? 'text-sky-900 font-bold' : 'hover:text-slate-900'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onNavigate('verify-public')}
            className={`transition-colors whitespace-nowrap ${
              currentView === 'verify-public' ? 'text-sky-900 font-bold' : 'hover:text-slate-900'
            }`}
          >
            QR Verification
          </button>
          <button
            onClick={() => {
              onNavigate('landing');
              setTimeout(() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="transition-colors hover:text-slate-900 whitespace-nowrap"
          >
            How It Works
          </button>
        </nav>

        {/* Zone 3: Actions & Persona Switcher */}
        <div className="flex items-center gap-3">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                setShowPersonaMenu(false);
              }}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-600 rounded-full"></span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 text-left">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Notifications ({unreadCount} new)</span>
                  <span className="text-[10px] text-slate-500">Real-time alerts</span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">No new notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          onMarkNotificationRead(n.id);
                          if (n.link) {
                            if (currentUser?.role === 'SUPER_ADMIN') onNavigate('admin-dashboard');
                            if (currentUser?.role === 'INSTITUTION_ADMIN') onNavigate('institution-dashboard');
                          }
                          setShowNotifMenu(false);
                        }}
                        className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                          n.isRead ? 'opacity-60' : 'bg-sky-50/40'
                        }`}
                      >
                        <p className="font-semibold text-slate-800">{n.title}</p>
                        <p className="text-slate-600 text-[11px] mt-0.5">{n.message}</p>
                        <span className="text-[9px] text-slate-400 block mt-1">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Persona Switcher Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowPersonaMenu(!showPersonaMenu);
                setShowNotifMenu(false);
              }}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-sky-800" />
              <div className="text-left hidden sm:block">
                <span className="block text-[11px] font-bold text-slate-900 leading-tight">
                  {currentUser?.fullName?.split(' ')[0] || 'Select Role'}
                </span>
                <span className="block text-[9px] text-slate-500 font-normal leading-tight">
                  {currentUser?.role?.replace('_', ' ')}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showPersonaMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 text-left">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-[11px] font-bold text-slate-900">Switch Demo Persona</p>
                  <p className="text-[10px] text-slate-500">Instant evaluation across all 4 stakeholder roles</p>
                </div>
                <div className="py-1">
                  {personas.map((p) => {
                    const Icon = p.icon;
                    const isActive = currentUser?.role === p.role;
                    return (
                      <button
                        key={p.role}
                        onClick={() => {
                          onSwitchPersona(p.role);
                          setShowPersonaMenu(false);
                          onNavigate(getDashboardViewForRole(p.role));
                        }}
                        className={`w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors ${
                          isActive ? 'bg-sky-50' : ''
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${p.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate ${isActive ? 'text-sky-900' : 'text-slate-800'}`}>
                            {p.name}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">{p.title}</p>
                        </div>
                        {isActive && <span className="text-[10px] font-bold text-sky-700">Active</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
