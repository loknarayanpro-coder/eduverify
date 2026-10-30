/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api } from './services/api.ts';
import { User, Notification } from './server/types.ts';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard.tsx';
import { InstitutionDashboard } from './pages/InstitutionDashboard.tsx';
import { StudentDashboard } from './pages/StudentDashboard.tsx';
import { VerifierDashboard } from './pages/VerifierDashboard.tsx';
import { PublicVerifyPage } from './pages/PublicVerifyPage.tsx';
import { RegisterInstitutionModal } from './components/RegisterInstitutionModal.tsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('landing');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [verifyToken, setVerifyToken] = useState<string>('COEP-2024-CSE-001');
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);

  // Initialize user session & notifications
  const initApp = async () => {
    try {
      const demoUsersRes = await api.getDemoUsers();
      if (demoUsersRes.success && demoUsersRes.users.length > 0) {
        // Default to Super Admin on first load
        const admin = demoUsersRes.users.find((u) => u.role === 'SUPER_ADMIN') || demoUsersRes.users[0];
        setCurrentUser(admin);
        localStorage.setItem('eduverify_token', admin.id);

        const notifRes = await api.getNotifications(admin.role, admin.id);
        if (notifRes.success) {
          setNotifications(notifRes.notifications);
        }
      }
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    initApp();
  }, []);

  // Handle Persona Switching
  const handleSwitchPersona = async (role: string, userId?: string) => {
    try {
      const res = await api.switchPersona(role, userId);
      if (res.success) {
        setCurrentUser(res.user);
        // Refresh notifications for new persona
        const notifRes = await api.getNotifications(res.user.role, res.user.id);
        if (notifRes.success) {
          setNotifications(notifRes.notifications);
        }
      }
    } catch (err) {
      console.error('Failed to switch persona:', err);
    }
  };

  // Reset database to initial state
  const handleResetData = async () => {
    if (window.confirm('Reset EduVerify database to the clean initial demo state?')) {
      const res = await api.resetDatabase();
      if (res.success) {
        alert('Database successfully reset to initial synthetic Indian education dataset.');
        window.location.reload();
      }
    }
  };

  // Mark notification as read
  const handleMarkNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  // Quick verify from landing page
  const handleQuickVerify = (token: string) => {
    setVerifyToken(token);
    setCurrentView('verify-public');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar
        currentUser={currentUser}
        onSwitchPersona={handleSwitchPersona}
        onResetData={handleResetData}
        currentView={currentView}
        onNavigate={setCurrentView}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
      />

      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onNavigate={setCurrentView}
            onQuickVerify={handleQuickVerify}
            onOpenRegisterModal={() => setShowRegisterModal(true)}
          />
        )}

        {currentView === 'admin-dashboard' && <SuperAdminDashboard />}

        {currentView === 'institution-dashboard' && (
          <InstitutionDashboard institutionId={currentUser?.institutionId || 'inst-coep-pune'} />
        )}

        {currentView === 'student-dashboard' && (
          <StudentDashboard studentId={currentUser?.studentId || 'COEP-2024-CSE-001'} />
        )}

        {currentView === 'verifier-dashboard' && <VerifierDashboard />}

        {currentView === 'verify-public' && (
          <PublicVerifyPage initialToken={verifyToken} onNavigate={setCurrentView} />
        )}
      </main>

      <Footer onNavigate={setCurrentView} />

      {/* Register Institution Modal */}
      {showRegisterModal && (
        <RegisterInstitutionModal
          onClose={() => setShowRegisterModal(false)}
          onSuccess={() => {
            // Reload data if on admin view
            if (currentView === 'admin-dashboard') {
              window.location.reload();
            }
          }}
        />
      )}
    </div>
  );
}
