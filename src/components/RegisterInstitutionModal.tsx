import React, { useState } from 'react';
import { api } from '../services/api.ts';
import { Building2, X, CheckCircle2 } from 'lucide-react';

interface RegisterInstitutionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const RegisterInstitutionModal: React.FC<RegisterInstitutionModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [type, setType] = useState('ENGINEERING');
  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('Pune');
  const [address, setAddress] = useState('');
  const [approvedIntake, setApprovedIntake] = useState('120');
  const [establishedYear, setEstablishedYear] = useState('1995');
  const [website, setWebsite] = useState('https://');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('+91-');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !approvedIntake) {
      setError('Institution Name and Approved Intake are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.createInstitution({
        name,
        shortName,
        type: type as any,
        state,
        district,
        address,
        approvedIntake: Number(approvedIntake),
        supernumeraryLimit: Math.round(Number(approvedIntake) * 0.15),
        establishedYear: Number(establishedYear),
        website,
        contactEmail,
        contactPhone,
      });

      if (res.success) {
        setRegistered(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setError('Failed to submit registration application.');
      }
    } catch (err: any) {
      setError(err.message || 'Submission error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-4 my-8">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-900" />
            <h2 className="text-base font-bold text-slate-900">Institution Registration (AICTE)</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {registered ? (
          <div className="p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-teal-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Application Submitted for AICTE Approval</h3>
            <p className="text-xs text-slate-600">
              Your institutional registration application has been lodged into the central registry. The AICTE regulatory council has received your intake approval request.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && <div className="p-2.5 bg-rose-50 text-rose-900 border border-rose-200 rounded">{error}</div>}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Institution Full Legal Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. National Institute of Technology Calicut"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-sky-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Short Name / Acronym</label>
                <input
                  type="text"
                  placeholder="e.g. NIT Calicut"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Institution Category</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border rounded bg-white"
                >
                  <option value="ENGINEERING">Engineering & Technology</option>
                  <option value="MANAGEMENT">Management (MBA/PGDM)</option>
                  <option value="POLYTECHNIC">Polytechnic Diploma</option>
                  <option value="PHARMACY">Pharmacy</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">State *</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Requested Approved Intake *</label>
                <input
                  type="number"
                  required
                  value={approvedIntake}
                  onChange={(e) => setApprovedIntake(e.target.value)}
                  className="w-full px-3 py-2 border rounded font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Established Year</label>
                <input
                  type="number"
                  value={establishedYear}
                  onChange={(e) => setEstablishedYear(e.target.value)}
                  className="w-full px-3 py-2 border rounded font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Contact Email</label>
                <input
                  type="email"
                  placeholder="registrar@nitc.ac.in"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-sky-900 hover:bg-sky-800 disabled:opacity-50 text-white font-bold rounded shadow transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
