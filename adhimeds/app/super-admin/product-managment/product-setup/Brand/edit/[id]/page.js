'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import BrandForm from '../../components/BrandForm';
import { getBrandById } from '../../../../../../services/brandAPI';


export default function EditBrandPage() {
  const { id } = useParams();
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const res = await getBrandById(id);
        if (res.success) {
          setBrand(res.data);
        } else {
          toast.error(res.message || 'Brand not found');
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to load brand');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchBrand();
  }, [id]);

  if (loading) return <div className="brand-form-container"><div className="loading-spinner">Loading brand...</div></div>;
  if (!brand) return <div className="brand-form-container"><div className="error-message">Brand not found</div></div>;

  return (
    <>
      <Toaster position="top-right" />
      <BrandForm initialData={brand} isEdit={true} />
    </>
  );
}