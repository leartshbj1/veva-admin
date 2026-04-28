import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/errorUtils';
import { ArrowLeft, UserPlus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Employee {
  id: string; // auth uid
  email: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
  createdAt: number;
}

export default function AdminEmployees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newUid, setNewUid] = useState(''); // UID is needed for the doc ID. To get UID from email, typically requires Firebase Admin SDK. 
  // Wait! In Firestore rules: allow create if ... isValidId(userId). If they sign in, their UID is created in Auth. 
  // We can't easily map email to UID client-side without Cloud Functions!

  useEffect(() => {
    // We only load employees if the user is the admin.
    const q = query(collection(db, 'employees'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'employees'));

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <header className="flex items-center gap-4 bg-slate-900 px-4 sm:px-8 py-4 shadow-sm border-b border-slate-700 text-white shrink-0 h-16">
        <Link to="/" className="p-2 -ml-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold tracking-tight">Gestion des employés</h1>
      </header>
      <main className="flex-1 p-4 sm:p-8 pb-20 max-w-3xl mx-auto w-full">
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-sm mb-6">
          <strong>Note Administrative :</strong> Pour ajouter un employé via l'application, vous devez connaître son "User ID" Firebase. Pour une gestion plus simple, il est recommandé d'ajouter les employés directement depuis la console Firebase Firestore dans la collection <code className="bg-amber-100 px-1 rounded font-mono">employees</code> en utilisant leur UID généré lors de leur première connexion.
        </div>

        <div className="space-y-4">
          {employees.map(emp => (
            <div key={emp.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-bold text-slate-900 text-base">{emp.name}</p>
                <p className="text-sm text-slate-500">{emp.email}</p>
                <div className="mt-2">
                  <span className="inline-flex rounded px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-widest border border-slate-200">
                    {emp.role}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100">UID: {emp.id}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
