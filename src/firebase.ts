import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { CompanyConfig, PoolModel, Accessory, ProjectPhoto, Testimonial, MaintenanceVisit, MasterUser, QuoteOrder } from './types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use the dedicated Firestore database ID configured for this applet
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export interface AppSyncData {
  config?: CompanyConfig;
  models?: PoolModel[];
  accessories?: Accessory[];
  projects?: ProjectPhoto[];
  testimonials?: Testimonial[];
  maintenances?: MaintenanceVisit[];
  masterUsers?: MasterUser[];
  quotes?: QuoteOrder[];
  updatedAt?: string;
}

const DATA_COLLECTION = 'piscinas_bruzzone';
const DATA_DOC_ID = 'app_state';

// Real-time Cloud Listener across all devices, incognito windows, mobile, and web
export function subscribeToCloudData(onDataReceived: (data: AppSyncData) => void): () => void {
  try {
    const docRef = doc(db, DATA_COLLECTION, DATA_DOC_ID);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as AppSyncData;
          onDataReceived(data);
        }
      },
      (error) => {
        console.warn('Firestore subscription error (using fallback):', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Could not start Firestore listener:', err);
    return () => {};
  }
}

// Fetch Cloud Data directly
export async function getCloudData(): Promise<AppSyncData | null> {
  try {
    const docRef = doc(db, DATA_COLLECTION, DATA_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as AppSyncData;
    }
    return null;
  } catch (err) {
    console.warn('Error fetching cloud data from Firestore:', err);
    return null;
  }
}

// Save all modifications to Cloud Firestore so EVERYONE in Incognito / Other devices gets the update in real time
export async function syncDataToCloud(data: Partial<AppSyncData>): Promise<boolean> {
  try {
    const docRef = doc(db, DATA_COLLECTION, DATA_DOC_ID);
    const payload = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (err) {
    console.error('Error writing to Firestore cloud:', err);
    return false;
  }
}
