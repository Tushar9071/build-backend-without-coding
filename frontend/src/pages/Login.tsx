import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Github, LayoutGrid } from 'lucide-react';

export default function Login() {
    const { user, signInWithGoogle, signInWithGithub } = useAuth();

    if (user) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-xl">

                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-600/30">
                        <LayoutGrid className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-slate-400">Sign in to access your workflows and databases.</p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={signInWithGoogle}
                        className="w-full bg-white hover:bg-slate-100 text-slate-900 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-3"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                        Continue with Google
                    </button>

                    <button
                        onClick={signInWithGithub}
                        className="w-full bg-[#24292F] hover:bg-[#24292F]/90 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-3"
                    >
                        <Github className="w-5 h-5" />
                        Continue with GitHub
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                    <p className="text-xs text-slate-500">
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>
        </div>
    );
}
