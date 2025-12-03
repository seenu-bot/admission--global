/**
 * Migration script to transfer data from 'admissionForms' to 'admissions' collection
 * 
 * This script should be run once to migrate existing data.
 * Run this from the browser console or create an admin page to execute it.
 */

import { collection, getDocs, addDoc, query, deleteDoc, doc, writeBatch } from "firebase/firestore";
import { db } from "@/firebase/firebase";

export async function migrateAdmissionFormsToAdmissions() {
  try {
    console.log('Starting migration from admissionForms to admissions...');
    
    // Get all documents from admissionForms collection
    const admissionFormsRef = collection(db, 'admissionForms');
    const snapshot = await getDocs(query(admissionFormsRef));
    
    if (snapshot.empty) {
      console.log('No documents found in admissionForms collection. Migration not needed.');
      return { success: true, migrated: 0, message: 'No data to migrate' };
    }
    
    const admissionsRef = collection(db, 'admissions');
    let migratedCount = 0;
    let errorCount = 0;
    
    // Transfer each document
    for (const docSnapshot of snapshot.docs) {
      try {
        const data = docSnapshot.data();
        
        // Add migration metadata
        const migratedData = {
          ...data,
          migratedFrom: 'admissionForms',
          migratedAt: new Date().toISOString(),
          originalId: docSnapshot.id,
        };
        
        // Add to admissions collection
        await addDoc(admissionsRef, migratedData);
        migratedCount++;
        console.log(`Migrated document ${docSnapshot.id} (${migratedCount}/${snapshot.size})`);
      } catch (error) {
        console.error(`Error migrating document ${docSnapshot.id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`Migration completed! Migrated: ${migratedCount}, Errors: ${errorCount}`);
    
    return {
      success: true,
      migrated: migratedCount,
      errors: errorCount,
      total: snapshot.size,
      message: `Successfully migrated ${migratedCount} out of ${snapshot.size} documents`
    };
  } catch (error) {
    console.error('Migration error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Migration failed'
    };
  }
}

// Function to check if migration is needed
export async function checkMigrationStatus() {
  try {
    const admissionFormsRef = collection(db, 'admissionForms');
    const admissionsRef = collection(db, 'admissions');
    
    const [formsSnapshot, admissionsSnapshot] = await Promise.all([
      getDocs(query(admissionFormsRef)),
      getDocs(query(admissionsRef))
    ]);
    
    return {
      admissionFormsCount: formsSnapshot.size,
      admissionsCount: admissionsSnapshot.size,
      needsMigration: formsSnapshot.size > 0
    };
  } catch (error) {
    console.error('Error checking migration status:', error);
    return {
      admissionFormsCount: 0,
      admissionsCount: 0,
      needsMigration: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Function to delete all documents from admissionForms collection
export async function deleteAdmissionFormsCollection() {
  try {
    console.log('Starting deletion of admissionForms collection...');
    
    const admissionFormsRef = collection(db, 'admissionForms');
    const snapshot = await getDocs(query(admissionFormsRef));
    
    if (snapshot.empty) {
      console.log('No documents found in admissionForms collection. Nothing to delete.');
      return { success: true, deleted: 0, message: 'No data to delete' };
    }
    
    // Use batch writes for efficient deletion (Firestore allows up to 500 operations per batch)
    const batchSize = 500;
    let deletedCount = 0;
    let errorCount = 0;
    
    const docs = snapshot.docs;
    
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchDocs = docs.slice(i, i + batchSize);
      
      batchDocs.forEach((docSnapshot) => {
        try {
          batch.delete(doc(db, 'admissionForms', docSnapshot.id));
        } catch (error) {
          console.error(`Error adding delete to batch for ${docSnapshot.id}:`, error);
          errorCount++;
        }
      });
      
      try {
        await batch.commit();
        deletedCount += batchDocs.length;
        console.log(`Deleted batch: ${deletedCount}/${docs.length}`);
      } catch (error) {
        console.error(`Error committing batch:`, error);
        errorCount += batchDocs.length;
      }
    }
    
    console.log(`Deletion completed! Deleted: ${deletedCount}, Errors: ${errorCount}`);
    
    return {
      success: true,
      deleted: deletedCount,
      errors: errorCount,
      total: docs.length,
      message: `Successfully deleted ${deletedCount} out of ${docs.length} documents`
    };
  } catch (error) {
    console.error('Deletion error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Deletion failed'
    };
  }
}
