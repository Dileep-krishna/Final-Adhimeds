'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addDeliveryBoyAPI } from '../../../services/deliveryService';
import DeliveryBoyForm from '../components/DeliveryBoyForm';

export default function AddDeliveryBoyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const addMutation = useMutation({
    mutationFn: async (formData) => {
      console.log('📤 addDeliveryBoyAPI called with FormData:');
      for (let [key, value] of formData.entries()) {
        console.log(`   ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
      }
      const response = await addDeliveryBoyAPI(formData);
      console.log('📥 API response:', response);
      return response;
    },
    onSuccess: (data) => {
      console.log('✅ Mutation success, data:', data);
      queryClient.invalidateQueries({ queryKey: ['deliveryBoys'] });
      showToast('Delivery boy added successfully!', 'success');
      router.push('/super-admin/delivery-boys');
    },
    onError: (err) => {
      console.error('❌ Mutation error:', err);
      showToast(`Add failed: ${err.message || 'Unknown error'}`, 'error');
    },
  });

  const handleSubmit = (formData) => {
    console.log('📝 Form submitted with data:', formData);

    // ✅ Validate required fields
    if (!formData.name?.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    if (!formData.phone?.trim()) {
      showToast('Phone number is required', 'error');
      return;
    }
    if (!formData.district?.trim()) {
      showToast('District is required', 'error');
      return;
    }
    if (!formData.aadharNumber?.trim()) {
      showToast('Aadhar Number is required', 'error');
      return;
    }
    if (!formData.licenseNumber?.trim()) {
      showToast('License Number is required', 'error');
      return;
    }
    if (!formData.bikeNumber?.trim()) {
      showToast('Bike Number is required', 'error');
      return;
    }
    // ✅ Password is required for adding
    if (!formData.password || formData.password.trim().length < 6) {
      showToast('Password is required (minimum 6 characters)', 'error');
      return;
    }
    // Validate file uploads
    if (!formData.aadharImage || !(formData.aadharImage instanceof File)) {
      showToast('Aadhar Image is required', 'error');
      return;
    }
    if (!formData.licenseImage || !(formData.licenseImage instanceof File)) {
      showToast('License Image is required', 'error');
      return;
    }

    const form = new FormData();
    form.append('name', formData.name);
    form.append('email', formData.email || '');
    form.append('phone', formData.phone);
    form.append('password', formData.password); // ✅ Always send password
    form.append('aadharNumber', formData.aadharNumber);
    form.append('licenseNumber', formData.licenseNumber);
    form.append('bikeNumber', formData.bikeNumber);
    form.append('district', formData.district);
    form.append('status', formData.status || 'active');
    form.append('aadharImage', formData.aadharImage);
    form.append('licenseImage', formData.licenseImage);

    console.log('📦 FormData constructed:');
    for (let [key, value] of form.entries()) {
      console.log(`   ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
    }

    addMutation.mutate(form);
  };

  return (
    <div className="container-fluid p-0">
      {toast.show && (
        <div
          className={`alert alert-${toast.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show m-3 position-fixed top-0 end-0`}
          style={{ zIndex: 1050, minWidth: '300px' }}
          role="alert"
        >
          <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
          {toast.message}
          <button
            type="button"
            className="btn-close"
            onClick={() => setToast({ ...toast, show: false })}
          />
        </div>
      )}
      <DeliveryBoyForm
        title="Add New Delivery Boy"
        onSubmit={handleSubmit}
        isSubmitting={addMutation.isPending}
        submitLabel="Add Boy"
      />
    </div>
  );
}