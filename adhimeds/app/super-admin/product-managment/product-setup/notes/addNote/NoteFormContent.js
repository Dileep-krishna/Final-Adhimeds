'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createNoteAPI, getNoteByIdAPI, updateNoteAPI } from '../../../../../services/noteAPI';
import './note-form.css';

export default function NoteFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noteId = searchParams.get('id');
  const typeParam = searchParams.get('type');          // <-- get type from URL

  const [formData, setFormData] = useState({
    type: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!noteId);

  const noteTypes = ['Shipping', 'Refund', 'Warranty', 'Delivery', 'Medical Advice', 'Prescription', 'Lab Result'];

  // NEW: Pre‑fill type when adding a new note and a valid typeParam is present
  useEffect(() => {
    if (!noteId && typeParam && noteTypes.includes(typeParam)) {
      setFormData(prev => ({ ...prev, type: typeParam }));
    }
  }, [noteId, typeParam]);

  // Edit mode: fetch existing note data (overrides the pre‑fill)
  useEffect(() => {
    if (noteId) {
      const fetchNote = async () => {
        try {
          const response = await getNoteByIdAPI(noteId);
          if (response.success) {
            const note = response.data;
            setFormData({
              type: note.type,
              description: note.description,
            });
          } else {
            toast.error(response.message || 'Failed to load note');
            router.push('/super-admin/product-managment/product-setup/notes');
          }
        } catch (error) {
          console.error('Fetch note error:', error);
          toast.error('Network error while loading note');
          router.push('/super-admin/product-managment/product-setup/notes');
        } finally {
          setFetching(false);
        }
      };
      fetchNote();
    }
  }, [noteId, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.type || !formData.description) {
      toast.warn('Please fill all required fields (Type and Description)');
      return;
    }
    if (formData.description.length > 900) {
      toast.warn('Description must not exceed 900 characters');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type: formData.type,
        description: formData.description,
        user: 'In-House',
        sellerCanAccess: false,
        image: null,
      };
      let response;
      if (noteId) {
        response = await updateNoteAPI(noteId, payload);
      } else {
        response = await createNoteAPI(payload);
      }
      if (response.success) {
        toast.success(noteId ? 'Note updated successfully' : 'Note created successfully');
        router.push('/super-admin/product-managment/product-setup/notes');
      } else {
        toast.error(response.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Save note error:', error);
      toast.error('Something went wrong. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="text-center py-5">Loading note...</div>;
  }

  return (
    <div className="note-form-wrapper">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="note-card">
        <div className="note-card-header">
          <h4>Note Information</h4>
        </div>
        <div className="note-card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Type</label>
              <select
                name="type"
                className="form-control-custom"
                value={formData.type}
                onChange={handleInputChange}
              >
                <option value="">Select Type</option>
                {noteTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Description (Max 900 characters)</label>
              <textarea
                name="description"
                className="form-control-custom"
                rows="5"
                maxLength="900"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter description..."
              />
              <div className="char-counter">
                {formData.description.length}/900 characters
              </div>
            </div>
            <div className="button-group">
              <button type="button" className="btn-cancel" onClick={() => router.back()}>
                Cancel
              </button>
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}