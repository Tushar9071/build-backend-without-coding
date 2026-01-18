import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../lib/firebase';
import { toast } from 'react-hot-toast';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithGithub: () => Promise<void>;
    logout: () => Promise<void>;
    getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            setLoading(false);
            if (currentUser) {
                // You could sync user to backend here if needed
            }
        });
        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            toast.success('Logged in with Google');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to login with Google');
        }
    };

    const signInWithGithub = async () => {
        try {
            await signInWithPopup(auth, githubProvider);
            toast.success('Logged in with GitHub');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to login with GitHub');
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            toast.success('Logged out');
        } catch (error) {
            toast.error('Failed to logout');
        }
    };

    const getToken = async () => {
        if (user) {
            return await user.getIdToken();
        }
        return null;
    }

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithGithub, logout, getToken }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
