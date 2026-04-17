'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api/axios';
import ServiceCard, { Service } from '@/components/ServiceCard';
import CreateServiceModal from '@/components/CreateServiceModal';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data);
    } catch (error) {
      toast.error('Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleCreateService = async (data: { name: string; repoUrl: string; branch: string; envVars: string }) => {
    try {
      await api.post('/services', data);
      toast.success('Service created successfully');
      fetchServices();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create service');
      throw error;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Services</h1>
          <p className="text-gray-400 mt-1">Manage and deploy your applications</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent-hover text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-[1.02] shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>New Service</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 h-48 animate-pulse flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="flex space-x-3">
                  <div className="w-10 h-10 bg-border rounded-lg" />
                  <div className="space-y-2">
                    <div className="w-32 h-5 bg-border rounded" />
                    <div className="w-20 h-3 bg-border rounded" />
                  </div>
                </div>
                <div className="w-16 h-5 bg-border rounded-full" />
              </div>
              <div className="space-y-2 pt-4 border-t border-border">
                <div className="w-full h-4 bg-border rounded" />
                <div className="w-2/3 h-4 bg-border rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 bg-card border border-border rounded-xl backdrop-blur-sm"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">No services yet</h3>
          <p className="text-gray-400 mb-6">Deploy your first application to get started.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-primary hover:text-primary-hover font-medium transition-colors"
          >
            Create a Service &rarr;
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}

      <CreateServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateService}
      />
    </div>
  );
}
