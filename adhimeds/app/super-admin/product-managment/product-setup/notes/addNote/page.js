import { Suspense } from 'react';
import NoteFormContent from './NoteFormContent';

export default function AddNotePage() {
  return (
    <Suspense fallback={<div className="text-center py-5">Loading form...</div>}>
      <NoteFormContent />
    </Suspense>
  );
}