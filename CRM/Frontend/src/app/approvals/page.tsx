"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { apiFetch, API_BASE_URL } from '@/lib/api';

export default function ApprovalsPage() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Determine if user can approve (Supervisors and Admins)
  const isApprover = user?.role === 'SUPERVISOR' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const url = isApprover 
        ? `${API_BASE_URL}/api/v1/approvals` 
        : `${API_BASE_URL}/api/v1/approvals?requesterId=${user?.id}`;
      
      const res = await apiFetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error('Failed to load approvals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchApprovals();
    }
  }, [user, isApprover]);

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await apiFetch(`/api/v1/approvals/${id}/review`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, notes: `Reviewed by ${user?.email}` })
      });
      
      if (res.ok) {
        alert(`Request ${status.toLowerCase()}`);
        fetchApprovals();
      } else {
        alert('Failed to review request');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': 
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Approved</span>;
      case 'REJECTED': 
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-rose-500/10 text-rose-500 border-rose-500/20">Rejected</span>;
      default: 
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-500/10 text-amber-500 border-amber-500/20">Pending</span>;
    }
  };

  return (
    <div className="flex-1 p-6 h-full flex flex-col">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Approval Management</h1>
          <p className="text-sm text-slate-500">
            {isApprover ? 'Review and manage agent requests.' : 'Track the status of your submitted requests.'}
          </p>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center flex-1">
          <div className="w-6 h-6 border-2 border-slate-500/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests.length === 0 ? (
            <div className="p-12 text-center text-slate-500 border border-dashed border-[#333] rounded-xl">
              No approval requests found.
            </div>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="bg-[#050505] border border-[#222] rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row">
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-lg text-primary">{req.type}</span>
                      {getStatusBadge(req.status)}
                    </div>
                    <p className="text-sm text-slate-500 mb-4">
                      Requested by {req.requester?.agentProfile?.name || req.requester?.email} • {new Date(req.createdAt).toLocaleString()}
                    </p>
                    <div className="bg-[#111] rounded-md p-4 mb-4 border border-[#222]">
                      <pre className="text-sm text-slate-300 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(req.details, null, 2)}
                      </pre>
                    </div>
                    
                    {req.notes && (
                      <div className="text-sm text-slate-400 italic border-l-2 border-[#333] pl-3">
                        Approver notes: {req.notes}
                      </div>
                    )}
                  </div>
                </div>
                
                {isApprover && req.status === 'PENDING' && (
                  <div className="bg-[#0a0a0a] p-6 md:w-64 flex flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-[#222]">
                    <button 
                      onClick={() => handleReview(req.id, 'APPROVED')}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button 
                      onClick={() => handleReview(req.id, 'REJECTED')}
                      className="w-full flex items-center justify-center gap-2 border border-rose-600/30 text-rose-500 hover:bg-rose-600/10 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
