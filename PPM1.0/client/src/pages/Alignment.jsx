import React, { useState, useEffect } from 'react';
import { fetchAlignments, performAlignment, importAlignments } from '../services/alignmentService';
import AlignmentList from '../components/AlignmentList';
import AlignmentForm from '../components/AlignmentForm';
import ImportModal from '../components/ImportModal';

const Alignment = () => {
  const [alignments, setAlignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    loadAlignments();
  }, []);

  const loadAlignments = async () => {
    try {
      setLoading(true);
      const data = await fetchAlignments();
      setAlignments(data);
    } catch (error) {
      console.error('Error loading alignments:', error);
      alert('Failed to load alignments: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePerformAlignment = () => {
    setShowForm(true);
  };

  const handleAlignmentSubmit = async (alignmentData) => {
    try {
      await performAlignment(alignmentData);
      setShowForm(false);
      loadAlignments();
    } catch (error) {
      console.error('Error performing alignment:', error);
      alert('Failed to perform alignment: ' + error.message);
    }
  };

  const handleImport = async (file) => {
    try {
      const result = await importAlignments(file);
      setShowImportModal(false);
      loadAlignments(); // Refresh the list
      return result;
    } catch (error) {
      console.error('Error importing alignments:', error);
      throw error;
    }
  };

  const handleImportClick = () => {
    setShowImportModal(true);
  };

  if (loading) return <div className="text-center py-10">Loading alignments...</div>;

  return (
    <div className="alignment">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Alignment Management</h1>
        <div className="flex space-x-3">
          <button 
            onClick={handleImportClick}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Import Alignments
          </button>
          <button 
            onClick={handlePerformAlignment}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Perform New Alignment
          </button>
        </div>
      </div>

      {showForm ? (
        <AlignmentForm 
          onSubmit={handleAlignmentSubmit}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <AlignmentList alignments={alignments} />
      )}

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
        title="Import Alignments"
      />
    </div>
  );
};

export default Alignment;