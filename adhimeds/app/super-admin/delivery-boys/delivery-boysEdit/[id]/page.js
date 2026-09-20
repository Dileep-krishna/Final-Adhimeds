'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDeliveryBoysAPI, updateDeliveryBoyAPI } from '../../../../services/deliveryService';
import DeliveryBoyForm from '../../components/DeliveryBoyForm';

export default function EditDeliveryBoyPage() {
  const router = useRouter();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // ✅ Force refetch on mount to get fresh data
  const { data: deliveryBoys = [], isLoading, error, refetch } = useQuery({
    queryKey: ['deliveryBoys'],
    queryFn: async () => {
      const result = await getDeliveryBoysAPI();
      console.log('📦 API result:', result);
      let data = [];
      if (Array.isArray(result)) data = result;
      else if (result?.data && Array.isArray(result.data)) data = result.data;
      else if (result?.success && Array.isArray(result?.data)) data = result.data;
      else if (result?.boys && Array.isArray(result.boys)) data = result.boys;
      else {
        console.warn('⚠️ Unexpected format:', result);
        data = [];
      }
      // ✅ Map ALL fields, including image URLs
      return data.map((boy) => ({
        id: boy._id,
        name: boy.name,
        email: boy.email || '',
        phone: boy.phone,
        district: boy.district || boy.zone || '',
        status: boy.status,
        aadharNumber: boy.aadharNumber || '',
        licenseNumber: boy.licenseNumber || '',
        bikeNumber: boy.bikeNumber || '',
        aadharImage: boy.aadharImage || '',
        licenseImage: boy.licenseImage || '',
      }));
    },
    staleTime: 0, // ✅ Always fetch fresh
    refetchOnMount: true,
  });

  // ✅ Force refetch when component mounts
  useEffect(() => {
    refetch();
  }, []);

  const boy = deliveryBoys.find((b) => b.id === id);
  console.log('🔎 Found boy:', boy);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateDeliveryBoyAPI(id, data),
    onSuccess: () => {
      showToast('Delivery boy updated successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['deliveryBoys'] });
      router.push('/super-admin/delivery-boys');
    },
    onError: (err) => {
      showToast(`Update failed: ${err.message}`, 'error');
    },
  });

  const handleSubmit = (formData) => {
    const form = new FormData();
    form.append('name', formData.name);
    form.append('email', formData.email || '');
    form.append('phone', formData.phone);
    if (formData.password) form.append('password', formData.password);
    form.append('aadharNumber', formData.aadharNumber || '');
    form.append('licenseNumber', formData.licenseNumber || '');
    form.append('bikeNumber', formData.bikeNumber || '');
    form.append('district', formData.district);
    form.append('status', formData.status);
    if (formData.aadharImage instanceof File) {
      form.append('aadharImage', formData.aadharImage);
    }
    if (formData.licenseImage instanceof File) {
      form.append('licenseImage', formData.licenseImage);
    }

    updateMutation.mutate({ id, data: form });
  };

  if (isLoading) return <div className="loading-state"><div className="spinner"></div><p>Loading...</p></div>;
  if (error) return <div className="error-state"><p>Error: {error.message}</p></div>;
  if (!boy) return <div className="error-state"><p>Delivery boy not found. Please check the ID.</p></div>;

  return (
    <div className="delivery-form-page">
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
          <span>{toast.message}</span>
        </div>
      )}
      <DeliveryBoyForm
        key={boy.id} // ✅ Forces re‑mount when boy changes
        title="Edit Delivery Boy"
        initialData={boy}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
        submitLabel="Update Boy"
      />
    </div>
  );
}