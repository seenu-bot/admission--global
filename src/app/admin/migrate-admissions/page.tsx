"use client";

import { useState } from "react";
import { migrateAdmissionFormsToAdmissions, checkMigrationStatus, deleteAdmissionFormsCollection } from "@/lib/migrateAdmissions";

export default function MigrateAdmissionsPage() {
  const [status, setStatus] = useState<any>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<any>(null);

  const handleCheckStatus = async () => {
    const result = await checkMigrationStatus();
    setStatus(result);
    // Auto-refresh after migration or deletion
    if (migrationResult || deleteResult) {
      setTimeout(async () => {
        const updatedStatus = await checkMigrationStatus();
        setStatus(updatedStatus);
      }, 1000);
    }
  };

  const handleMigrate = async () => {
    if (!confirm('Are you sure you want to migrate data from admissionForms to admissions? This will copy all existing data.')) {
      return;
    }

    setMigrating(true);
    setMigrationResult(null);
    
    try {
      const result = await migrateAdmissionFormsToAdmissions();
      setMigrationResult(result);
      // Refresh status after migration
      setTimeout(async () => {
        const updatedStatus = await checkMigrationStatus();
        setStatus(updatedStatus);
      }, 1000);
    } catch (error) {
      setMigrationResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setMigrating(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admissions Migration Tool</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Migration Status</h2>
          <button
            onClick={handleCheckStatus}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mb-4"
          >
            Check Status
          </button>
          
          {status && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <p><strong>admissionForms count:</strong> {status.admissionFormsCount}</p>
              <p><strong>admissions count:</strong> {status.admissionsCount}</p>
              <p><strong>Needs migration:</strong> {status.needsMigration ? 'Yes' : 'No'}</p>
              {status.error && <p className="text-red-600"><strong>Error:</strong> {status.error}</p>}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Run Migration</h2>
          <p className="text-gray-600 mb-4">
            This will copy all data from the 'admissionForms' collection to the 'admissions' collection.
            The original data in 'admissionForms' will remain unchanged.
          </p>
          <button
            onClick={handleMigrate}
            disabled={migrating}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {migrating ? 'Migrating...' : 'Start Migration'}
          </button>
          
          {migrationResult && (
            <div className={`mt-4 p-4 rounded ${migrationResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={migrationResult.success ? 'text-green-800' : 'text-red-800'}>
                <strong>{migrationResult.success ? 'Success!' : 'Error:'}</strong> {migrationResult.message}
              </p>
              {migrationResult.migrated !== undefined && (
                <p className="mt-2">
                  Migrated: {migrationResult.migrated} / {migrationResult.total || 0}
                  {migrationResult.errors > 0 && (
                    <span className="text-red-600"> (Errors: {migrationResult.errors})</span>
                  )}
                </p>
              )}
              {migrationResult.error && (
                <p className="text-red-600 mt-2">{migrationResult.error}</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Delete Old Collection</h2>
          <p className="text-gray-600 mb-4">
            <strong>Warning:</strong> This will permanently delete all documents from the 'admissionForms' collection.
            Only do this after verifying that the migration was successful.
          </p>
          <button
            onClick={async () => {
              if (!confirm('Are you absolutely sure you want to delete all data from admissionForms collection? This action cannot be undone!')) {
                return;
              }
              if (!confirm('This will permanently delete all documents. Are you really sure?')) {
                return;
              }
              
              setDeleting(true);
              setDeleteResult(null);
              
              try {
                const result = await deleteAdmissionFormsCollection();
                setDeleteResult(result);
                // Refresh status after deletion
                await handleCheckStatus();
              } catch (error) {
                setDeleteResult({
                  success: false,
                  error: error instanceof Error ? error.message : 'Unknown error'
                });
              } finally {
                setDeleting(false);
              }
            }}
            disabled={deleting || !status?.admissionFormsCount}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {deleting ? 'Deleting...' : 'Delete admissionForms Collection'}
          </button>
          
          {deleteResult && (
            <div className={`mt-4 p-4 rounded ${deleteResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={deleteResult.success ? 'text-green-800' : 'text-red-800'}>
                <strong>{deleteResult.success ? 'Success!' : 'Error:'}</strong> {deleteResult.message}
              </p>
              {deleteResult.deleted !== undefined && (
                <p className="mt-2">
                  Deleted: {deleteResult.deleted} / {deleteResult.total || 0}
                  {deleteResult.errors > 0 && (
                    <span className="text-red-600"> (Errors: {deleteResult.errors})</span>
                  )}
                </p>
              )}
              {deleteResult.error && (
                <p className="text-red-600 mt-2">{deleteResult.error}</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Important Notes:</h3>
          <ul className="list-disc list-inside text-yellow-700 space-y-1">
            <li>This migration copies data - it does not delete the original 'admissionForms' collection</li>
            <li>After verifying the migration, use the "Delete admissionForms Collection" button above to remove the old collection</li>
            <li>New form submissions are now automatically saved to 'admissions' collection</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

