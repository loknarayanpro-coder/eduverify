import React from 'react';
import { ShieldCheck, BookOpen, Lock, FileText, ExternalLink } from 'lucide-react';

export const Footer: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Purpose */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base">
              <img
                src="/logo.png"
                alt="EduVerify Logo"
                className="w-7 h-7 object-contain rounded bg-white p-0.5"
              />
              <span>EduVerify</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              National Student Data Management & Verifiable Credential Platform for AICTE-approved institutions under the Ministry of Education, Government of India.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-teal-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DPDP Act 2023 Compliant Architecture</span>
            </div>
          </div>

          {/* Core Modules */}
          <div className="space-y-2">
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider">Platform Pillars</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <button onClick={() => onNavigate('admin-dashboard')} className="hover:text-white transition-colors">
                  AICTE Central Repository
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('institution-dashboard')} className="hover:text-white transition-colors">
                  Institution Intake Monitoring
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('admin-dashboard')} className="hover:text-white transition-colors">
                  Cross-College Duplicate Blocker
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('verify-public')} className="hover:text-white transition-colors">
                  Tamper-Evident QR Verification
                </button>
              </li>
            </ul>
          </div>

          {/* Regulatory Standards */}
          <div className="space-y-2">
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider">Regulatory Standards</h4>
            <ul className="space-y-1.5 text-slate-400 text-[11px]">
              <li>• Automated Permanent Academic Account Registry (APAAR)</li>
              <li>• National Higher Education Qualification Framework (NHEQF)</li>
              <li>• Verhoeff Checksum Verification Specification</li>
              <li>• All India Survey on Higher Education (AISHE)</li>
            </ul>
          </div>

          {/* Quick Access */}
          <div className="space-y-2">
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider">Authorized Portals</h4>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('admin-dashboard')}
                className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors text-[11px] flex items-center justify-between"
              >
                <span>AICTE Council Portal</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </button>
              <button
                onClick={() => onNavigate('verify-public')}
                className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors text-[11px] flex items-center justify-between"
              >
                <span>Public Verifier Engine</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimers & Copyright */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-slate-400 font-medium">
              Copyright © 2026 EduVerify by <span className="text-sky-400 font-semibold">Lok</span>. All Rights Reserved.
            </p>
            <p className="text-slate-500 text-[10px]">
              AICTE National Student Data Registry · Developed & Engineered by <span className="text-teal-400 font-medium">Lok</span>.
            </p>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Privacy & Consent Safeguards</span>
            <span>·</span>
            <span>Security Invariants</span>
            <span>·</span>
            <span>DPDP Act Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
