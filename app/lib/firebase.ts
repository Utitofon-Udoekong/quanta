import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const db = getFirestore(app);

// User Management
export interface UserData {
  walletAddress: string;
  name?: string;
  email?: string;
  image?: string;
  metaAccountId?: string;
  isCreator: boolean;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const createOrUpdateUser = async (walletAddress: string, userData: Partial<UserData>): Promise<UserData> => {
  const userRef = doc(db, 'users', walletAddress);
  const userDoc = await getDoc(userRef);

  const now = new Date();
  const data: UserData = {
    walletAddress,
    isCreator: false,
    isAdmin: false,
    createdAt: now,
    updatedAt: now,
    ...userData,
  };

  if (userDoc.exists()) {
    await updateDoc(userRef, {
      ...userData,
      updatedAt: now,
    });
    return { ...userDoc.data() as UserData, ...userData, updatedAt: now };
  } else {
    await setDoc(userRef, data);
    return data;
  }
};

export const getUserByWallet = async (walletAddress: string): Promise<UserData | null> => {
  const userRef = doc(db, 'users', walletAddress);
  const userDoc = await getDoc(userRef);
  return userDoc.exists() ? userDoc.data() as UserData : null;
};

// Content Management
export interface ContentData {
  id: string;
  title: string;
  description: string;
  type: 'VIDEO' | 'AUDIO' | 'COURSE';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  price: number;
  pricingModel: 'FREE' | 'PER_USE' | 'PER_MINUTE' | 'CUSTOM';
  creatorId: string;
  thumbnailUrl?: string;
  contentUrl?: string;
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  purchaseCount: number;
}

export const createContent = async (contentData: Omit<ContentData, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'purchaseCount'>): Promise<ContentData> => {
  const contentRef = doc(collection(db, 'content'));
  const now = new Date();
  
  const data: ContentData = {
    ...contentData,
    id: contentRef.id,
    createdAt: now,
    updatedAt: now,
    viewCount: 0,
    purchaseCount: 0,
  };

  await setDoc(contentRef, data);
  return data;
};

export const getContentByCreator = async (creatorId: string): Promise<ContentData[]> => {
  const q = query(collection(db, 'content'), where('creatorId', '==', creatorId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as ContentData);
};

export const getContentById = async (contentId: string): Promise<ContentData | null> => {
  const contentRef = doc(db, 'content', contentId);
  const contentDoc = await getDoc(contentRef);
  return contentDoc.exists() ? contentDoc.data() as ContentData : null;
};

// File Upload
export const uploadToFirebase = async (
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytes(storageRef, file);
    
    // Get download URL after upload
    const snapshot = await uploadTask;
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading to Firebase:', error);
    throw new Error('Failed to upload file');
  }
};

export const deleteFromFirebase = async (url: string): Promise<void> => {
  try {
    // Extract path from URL
    const path = decodeURIComponent(url.split('/o/')[1].split('?')[0]);
    const storageRef = ref(storage, path);
    
    // Delete the file
    await storageRef.delete();
  } catch (error) {
    console.error('Error deleting from Firebase:', error);
    throw new Error('Failed to delete file');
  }
}; 