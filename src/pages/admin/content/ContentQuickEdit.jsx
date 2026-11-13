// frontend/src/pages/admin/ContentQuickEdit.jsx
import { useEffect, useState } from 'react';
import GlassCard from '../../../components/GlassCard';
import ContentManager from './ContentManager';

export default function ContentQuickEdit() {
  // ContentManager already renders inside its own container.
  // We just wrap it in a header for context.
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white">Content Editor</h2>
        <p className="text-sm text-gray-400">
          Hero slides, partners, governance, pages, navigation, and footer.
        </p>
      </div>
      <div className="bg-white rounded-2xl overflow-hidden">
        <ContentManager />
      </div>
    </div>
  );
}