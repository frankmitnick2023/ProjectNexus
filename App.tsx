import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithCustomToken,
  signOut,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  updateDoc 
} from 'firebase/firestore';
import { 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Plus, 
  Trash2, 
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';

// --- FIREBASE INITIALIZATION & SAFETY CHECKS ---
// The error "Need to provide options" happens if initializeApp is called with undefined.
// We wrap this in a safe block to prevent the entire script from crashing (White Screen).

let app = null;
let auth = null;
let db = null;
let initError = null;
let appId = 'default-app-id';

try {
  // 1. Check if global config exists
  if (typeof __firebase_config === 'undefined' || !__firebase_config) {
    throw new Error("Global variable '__firebase_config' is undefined. The environment is not injecting the config.");
  }

  // 2. Parse the config
  const firebaseConfig = JSON.parse(__firebase_config);
  
  // 3. Check for valid App ID
  if (typeof __app_id !== 'undefined') {
    appId = __app_id;
  }

  // 4. Initialize Firebase safely
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

} catch (err) {
  console.error("Critical Firebase Initialization Error:", err);
  initError = err.message;
}

// --- APP COMPONENT ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. AUTHENTICATION EFFECT
  useEffect(() => {
    // If initialization failed globally, stop here.
    if (!auth || initError) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err: any) {
        console.error("Auth Error:", err);
        setAuthError(err.message);
      }
    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setAuthError(null); // Clear error on success
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. FIRESTORE DATA EFFECT
  useEffect(() => {
    if (!user || !db) return;

    setDbError(null);

    // Using the SAFE PATH rule: /artifacts/{appId}/users/{userId}/todos
    // We do not use complex queries like orderBy here to be safe, we sort in memory.
    const collectionRef = collection(db, 'artifacts', appId, 'users', user.uid, 'todos');
    
    // Simple query without compound indexes
    const q = query(collectionRef);

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const loadedItems = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort in memory (Rule 2: Avoid complex queries)
        loadedItems.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA; // Newest first
        });

        setItems(loadedItems);
        setDbError(null);
      },
      (err) => {
        console.error("Firestore Error:", err);
        setDbError(err.message);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // --- HANDLERS ---

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim() || !user || !db) return;

    setIsSubmitting(true);
    try {
      const collectionRef = collection(db, 'artifacts', appId, 'users', user.uid, 'todos');
      await addDoc(collectionRef, {
        text: newItemText,
        completed: false,
        createdAt: serverTimestamp()
      });
      setNewItemText('');
    } catch (err: any) {
      setDbError("Failed to add item: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    if (!user || !db) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'todos', id);
      await updateDoc(docRef, { completed: !currentStatus });
    } catch (err) {
      console.error("Error toggling:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !db) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'todos', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  // --- RENDER ---

  // CRITICAL: Render Error State if Init Failed
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full border border-red-200">
          <div className="flex items-center text-red-600 mb-4">
            <AlertCircle size={32} className="mr-3" />
            <h1 className="text-2xl font-bold">Initialization Failed</h1>
          </div>
          <p className="text-gray-700 mb-4">
            The application could not start because the Firebase configuration is missing or invalid.
          </p>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-md font-mono text-sm overflow-x-auto">
            {initError}
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Error Code: app/no-options
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* HEADER */}
        <header className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Status</h1>
              <p className="text-gray-500 mt-1">Firebase Connection Verification</p>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
              {user ? (
                <>
                  <Wifi size={18} className="text-green-600" />
                  <span className="text-sm font-medium text-green-700">Online</span>
                </>
              ) : (
                <>
                  <WifiOff size={18} className="text-amber-500" />
                  <span className="text-sm font-medium text-amber-700">Connecting...</span>
                </>
              )}
            </div>
          </div>

          {/* User ID Display (Required for Debugging) */}
          {user && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-xs text-gray-400 font-mono break-all">
                ID: {user.uid}
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Reload"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          )}
        </header>

        {/* ERROR BANNERS */}
        {authError && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start">
            <AlertCircle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-bold text-red-800">Authentication Error</h3>
              <p className="text-red-700 text-sm">{authError}</p>
            </div>
          </div>
        )}

        {dbError && (
          <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-start">
            <AlertCircle className="text-amber-500 mt-0.5 mr-3 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-bold text-amber-800">Database Connection Error</h3>
              <p className="text-amber-700 text-sm">{dbError}</p>
            </div>
          </div>
        )}

        {/* MAIN CONTENT */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          
          {/* Add Item Form */}
          <div className="p-6 bg-gray-50 border-b border-gray-100">
            <form onSubmit={handleAddItem} className="relative">
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder={user ? "Type to test database write..." : "Waiting for connection..."}
                disabled={!user || isSubmitting}
                className="w-full pl-4 pr-12 py-4 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-all placeholder:text-gray-400 text-lg disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!newItemText.trim() || !user || isSubmitting}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg flex items-center justify-center transition-all shadow-md"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Plus size={24} />}
              </button>
            </form>
          </div>

          {/* List Area */}
          <div className="min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                <Loader2 className="animate-spin mb-3" size={32} />
                <p>Establishing secure connection...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-400 p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} className="text-gray-300" />
                </div>
                <p className="text-lg font-medium text-gray-600">Ready to test</p>
                <p className="text-sm mt-1">Add an item above to verify database writes.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map((item) => (
                  <li key={item.id} className="group flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                    <button
                      onClick={() => toggleComplete(item.id, item.completed)}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        item.completed 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-gray-300 hover:border-blue-400 text-transparent'
                      }`}
                    >
                      <CheckCircle2 size={14} strokeWidth={3} />
                    </button>
                    
                    <span className={`flex-grow text-lg transition-all ${
                      item.completed ? 'text-gray-400 line-through' : 'text-gray-800'
                    }`}>
                      {item.text}
                    </span>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Footer Info */}
          <div className="bg-gray-50 p-4 border-t border-gray-100 text-center">
             <p className="text-xs text-gray-400">
               Data path: /artifacts/{appId}/users/{user?.uid.slice(0, 8)}.../todos
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}