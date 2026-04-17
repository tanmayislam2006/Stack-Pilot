'use client';

import Link from 'next/link';
import { Server, Activity, GitBranch, Terminal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import { motion } from 'framer-motion';

export interface Service {
  id: string;
  name: string;
  repoUrl: string;
  branch?: string;
  status: 'idle' | 'building' | 'running' | 'stopped' | 'error';
  port?: number;
  createdAt: string;
}

interface ServiceCardProps {
  service: Service;
}

const statusColors = {
  idle: 'bg-gray-500',
  building: 'bg-yellow-500 animate-pulse',
  running: 'bg-green-500',
  stopped: 'bg-red-500',
  error: 'bg-red-600',
};

export default function ServiceCard({ service }: ServiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/services/${service.id}`}>
        <div className="bg-card border border-border rounded-xl p-6 backdrop-blur-sm hover:border-primary/50 transition-all cursor-pointer group flex flex-col h-full shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Server className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white group-hover:text-primary transition-colors">
                  {service.name}
                </h3>
                <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                  <Activity className="h-3 w-3" />
                  <span>{formatDistanceToNow(new Date(service.createdAt))} ago</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={clsx("w-2.5 h-2.5 rounded-full", statusColors[service.status])} />
              <span className="text-xs uppercase tracking-wider text-gray-300 font-medium">
                {service.status}
              </span>
            </div>
          </div>

          <div className="mt-auto space-y-3 pt-4 border-t border-border">
            {service.branch && (
              <div className="flex items-center text-sm text-gray-400">
                <GitBranch className="h-4 w-4 mr-2" />
                <span className="truncate">{service.branch}</span>
              </div>
            )}
            {service.port && (
              <div className="flex items-center text-sm text-gray-400">
                <Terminal className="h-4 w-4 mr-2" />
                <span>Port: {service.port}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
