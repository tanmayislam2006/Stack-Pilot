'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api/axios';
import { Service } from '@/components/ServiceCard';
import Terminal from '@/components/Terminal';
import toast from 'react-hot-toast';
import { ArrowLeft, Play, Square, RefreshCw, GitPullRequest, GitBranch, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

const statusColors = {
  idle: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  building: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  running: 'text-green-400 bg-green-400/10 border-green-400/20',
  stopped: 'text-red-400 bg-red-400/10 border-red-400/20',
  error: 'text-red-600 bg-red-600/10 border-red-600/20',
};

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await api.get(`/services/${params.id}`);
        setService(response.data);
      } catch (error) {
        toast.error('Failed to load service');
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchService();
    // Poll service status every 5 seconds if building
    const interval = setInterval(() => {
      if (service?.status === 'building') {
        fetchService();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [params.id, service?.status, router]);

  const handleAction = async (action: 'deploy' | 'stop') => {
    setActionLoading(action);
    try {
      await api.post(`/${action}/${params.id}`);
      toast.success(`Service ${action === 'deploy' ? 'started' : 'stopped'} successfully`);

      // Refresh service data
      const response = await api.get(`/services/${params.id}`);
      setService(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${action} service`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!service) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-white">{service.name}</h1>
            <span className={clsx(
              "px-3 py-1 rounded-full text-xs font-medium border uppercase tracking-wider",
              statusColors[service.status]
            )}>
              {service.status}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {service.status === 'running' ? (
            <button
              onClick={() => handleAction('stop')}
              disabled={!!actionLoading}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'stop' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4 fill-current" />}
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={() => handleAction('deploy')}
              disabled={!!actionLoading || service.status === 'building'}
              className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'deploy' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
              <span>Deploy</span>
            </button>
          )}

          <button
            onClick={() => {
              setLoading(true);
              api.get(`/services/${params.id}`).then((res) => setService(res.data)).finally(() => setLoading(false));
            }}
            className="p-2 bg-card hover:bg-border border border-border rounded-lg text-gray-400 transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content (Terminal) */}
        <div className="lg:col-span-2 space-y-6">
          <Terminal serviceId={service.id} />
        </div>

        {/* Sidebar (Metadata) */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-4">Service Details</h3>

            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-500 block mb-1">Repository</span>
                <a
                  href={service.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-primary hover:underline break-all"
                >
                  <GitPullRequest className="h-4 w-4 mr-2 flex-shrink-0" />
                  {service.repoUrl}
                  <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                </a>
              </div>

              {service.branch && (
                <div>
                  <span className="text-sm text-gray-500 block mb-1">Branch</span>
                  <div className="flex items-center text-sm text-gray-300">
                    <GitBranch className="h-4 w-4 mr-2" />
                    {service.branch}
                  </div>
                </div>
              )}

              {service.port && (
                <div>
                  <span className="text-sm text-gray-500 block mb-1">Port Allocation</span>
                  <div className="text-sm text-gray-300 font-mono">
                    {service.port}
                  </div>
                </div>
              )}

              <div>
                <span className="text-sm text-gray-500 block mb-1">Created</span>
                <div className="text-sm text-gray-300">
                  {formatDistanceToNow(new Date(service.createdAt))} ago
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
