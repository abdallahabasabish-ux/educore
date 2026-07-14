import { useState, useCallback } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  QueryConstraint,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ApiResponse, PaginatedResponse } from '@/types';

interface UseFirestoreReturn<T> {
  loading: boolean;
  error: string | null;
  getDocument: (collectionName: string, id: string) => Promise<ApiResponse<T>>;
  getDocuments: (
    collectionName: string,
    constraints?: QueryConstraint[],
    pageSize?: number,
    startAfterDoc?: DocumentData
  ) => Promise<ApiResponse<PaginatedResponse<T>>>;
  createDocument: (collectionName: string, data: Partial<T>) => Promise<ApiResponse<T>>;
  updateDocument: (collectionName: string, id: string, data: Partial<T>) => Promise<ApiResponse<T>>;
  deleteDocument: (collectionName: string, id: string) => Promise<ApiResponse<void>>;
  addSubCollection: (collectionName: string, parentId: string, subCollection: string, data: Partial<T>) => Promise<ApiResponse<T>>;
}

export function useFirestore<T extends { id?: string }>(): UseFirestoreReturn<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDocument = useCallback(
    async (collectionName: string, id: string): Promise<ApiResponse<T>> => {
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return {
            success: true,
            data: { id: docSnap.id, ...docSnap.data() } as T,
          };
        }
        return {
          success: false,
          error: 'Document not found',
        };
      } catch (err) {
        const message = (err as Error).message;
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getDocuments = useCallback(
    async (
      collectionName: string,
      constraints: QueryConstraint[] = [],
      pageSize: number = 10,
      startAfterDoc?: DocumentData
    ): Promise<ApiResponse<PaginatedResponse<T>>> => {
      setLoading(true);
      setError(null);
      try {
        const constraintsArray: QueryConstraint[] = [...constraints];
        if (pageSize) {
          constraintsArray.push(limit(pageSize));
        }
        if (startAfterDoc) {
          constraintsArray.push(startAfter(startAfterDoc));
        }

        const q = query(collection(db, collectionName), ...constraintsArray);
        const querySnapshot = await getDocs(q);

        const items: T[] = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as T);
        });

        const total = querySnapshot.size;
        const totalPages = Math.ceil(total / pageSize);

        return {
          success: true,
          data: {
            items,
            total,
            page: startAfterDoc ? 2 : 1,
            pageSize,
            totalPages,
          },
        };
      } catch (err) {
        const message = (err as Error).message;
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createDocument = useCallback(
    async (collectionName: string, data: Partial<T>): Promise<ApiResponse<T>> => {
      setLoading(true);
      setError(null);
      try {
        const docRef = await addDoc(collection(db, collectionName), {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        const newDoc = await getDoc(docRef);
        return {
          success: true,
          data: { id: newDoc.id, ...newDoc.data() } as T,
        };
      } catch (err) {
        const message = (err as Error).message;
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateDocument = useCallback(
    async (collectionName: string, id: string, data: Partial<T>): Promise<ApiResponse<T>> => {
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(db, collectionName, id);
        await updateDoc(docRef, {
          ...data,
          updatedAt: serverTimestamp(),
        });
        const updatedDoc = await getDoc(docRef);
        return {
          success: true,
          data: { id: updatedDoc.id, ...updatedDoc.data() } as T,
        };
      } catch (err) {
        const message = (err as Error).message;
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteDocument = useCallback(
    async (collectionName: string, id: string): Promise<ApiResponse<void>> => {
      setLoading(true);
      setError(null);
      try {
        await deleteDoc(doc(db, collectionName, id));
        return { success: true };
      } catch (err) {
        const message = (err as Error).message;
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const addSubCollection = useCallback(
    async (
      collectionName: string,
      parentId: string,
      subCollection: string,
      data: Partial<T>
    ): Promise<ApiResponse<T>> => {
      setLoading(true);
      setError(null);
      try {
        const docRef = await addDoc(
          collection(db, collectionName, parentId, subCollection),
          {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }
        );
        const newDoc = await getDoc(docRef);
        return {
          success: true,
          data: { id: newDoc.id, ...newDoc.data() } as T,
        };
      } catch (err) {
        const message = (err as Error).message;
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    getDocument,
    getDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    addSubCollection,
  };
}
