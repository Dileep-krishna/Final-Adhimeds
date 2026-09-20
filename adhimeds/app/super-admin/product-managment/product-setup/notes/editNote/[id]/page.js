'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getNoteByIdAPI, updateNoteAPI } from '../../../../../../services/noteAPI';


export default function EditNotePage() {
  const router = useRouter();
  const { id } = useParams(); // get dynamic route parameter
  const noteId = id; // MongoDB uses string IDs

  const [formData, setFormData] = useState({
    user: 'In-House',
    type: '',
    description: '',
    sellerCanAccess: false,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const noteTypes = ['Shipping', 'Refund', 'Warranty', 'Delivery', 'Medical Advice', 'Prescription', 'Lab Result'];

  useEffect(() => {
    const fetchNote = async () => {
      try {
        console.log(`Fetching note with ID: ${noteId}`);
        const response = await getNoteByIdAPI(noteId);
        console.log('Get note response:', response);
        if (response.success) {
          const note = response.data;
          setFormData({
            user: note.user,
            type: note.type,
            description: note.description,
            sellerCanAccess: note.sellerCanAccess,
          });
          if (note.image) {
            // Build full URL if the image is a relative path
            const imageUrl = note.image.startsWith('http')
              ? note.image
              : `${process.env.NEXT_PUBLIC_SERVERURL}/${note.image}`;
            setImagePreview(imageUrl);
          }
        } else {
          toast.error(response.message || 'Failed to load note');
          router.push('/super-admin/product-managment/product-setup/notes');
        }
      } catch (error) {
        console.error('Fetch note error:', error);
        toast.error('Network error while loading note');
        router.push('/super-admin/product-managment/product-setup/notes');
      } finally {
        setLoading(false);
      }
    };

    if (noteId) fetchNote();
  }, [noteId, router]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('New image selected:', file.name);
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.type || !formData.description) {
      toast.warn('Please fill all required fields (Type and Description)');
      return;
    }

    setSaving(true);
    console.log('Updating note...', { noteId, formData, hasNewImage: !!imageFile });

    try {
      let response;
      if (imageFile) {
        // Use FormData for file upload
        const formDataToSend = new FormData();
        formDataToSend.append('user', formData.user);
        formDataToSend.append('type', formData.type);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('sellerCanAccess', formData.sellerCanAccess);
        formDataToSend.append('image', imageFile);
        response = await updateNoteAPI(noteId, formDataToSend);
      } else {
        // Send JSON (keep existing image or null)
        const payload = {
          user: formData.user,
          type: formData.type,
          description: formData.description,
          sellerCanAccess: formData.sellerCanAccess,
        };
        response = await updateNoteAPI(noteId, payload);
      }

      console.log('Update response:', response);
      if (response.success) {
        toast.success('Note updated successfully');
        router.push('/super-admin/product-managment/product-setup/notes');
      } else {
        toast.error(response.message || 'Update failed');
      }
    } catch (error) {
      console.error('Update note error:', error);
      toast.error('Something went wrong. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-5">Loading note...</div>;
  }

  return (
    <div className="notes-form-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="form-header">
        <h4>Edit Note</h4>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>User Type</label>
          <select name="user" className="form-control" value={formData.user} onChange={handleInputChange}>
            <option value="In-House">In-House</option>
            <option value="Seller">Seller</option>
          </select>
        </div>
        <div className="form-group">
          <label>Note Type *</label>
          <select name="type" className="form-control" value={formData.type} onChange={handleInputChange}>
            <option value="">Select Type</option>
            {noteTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Description *</label>
          <textarea name="description" className="form-control" rows="4" value={formData.description} onChange={handleInputChange} />
        </div>
        <div className="form-group">
          <label>Attach Image (optional)</label>
          <input type="file" className="form-control" accept="image/*" onChange={handleImageChange} />
          {imagePreview && (
            <div className="mt-2">
              <img src={imagePreview} alt="preview" className="image-preview" style={{ maxWidth: '200px' }} />
            </div>
          )}
        </div>
        <div className="form-group">
          <label className="d-flex align-items-center gap-2">
            <input type="checkbox" name="sellerCanAccess" checked={formData.sellerCanAccess} onChange={handleInputChange} />
            Seller Can Access This Note
          </label>
        </div>
        <div className="form-buttons">
          <button type="button" className="btn-cancel" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="btn-save" disabled={saving}>
            {saving ? 'Updating...' : 'Update'}
          </button>
        </div>
      </form>
    </div>
  );
}