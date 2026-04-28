import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-slate-50 px-4 font-sans">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="mb-8 flex flex-col items-center">
          <img src="/logo.png" alt="VEVA Logo" className="mb-4 w-16 h-16 rounded-xl object-cover shadow-lg shadow-slate-200" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">VEVA AUTOMOBILE</h1>
          <p className="mt-1 text-center text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Gestion Lavage Pro
          </p>
        </div>

        <button
          onClick={login}
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-4 py-3 font-bold text-white transition-colors hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-[0.98]"
        >
          <LogIn className="h-5 w-5" />
          Se connecter avec Google
        </button>
      </div>
    </div>
  );
}
