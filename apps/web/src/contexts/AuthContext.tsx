import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile, createUserProfile, type UserProfile } from '@/lib/firestore-services';
import { getFirebaseErrorMessage } from '@/lib/firebase-errors';

interface User {
  id: string;
  email: string;
  role: 'Farmer';
  displayName?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Get user profile from Firestore
          const profile = await getUserProfile(firebaseUser.uid);
          
          if (profile) {
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: profile.role,
              displayName: profile.displayName,
            });
          } else {
            // If no profile exists, create one with default role
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: 'Farmer',
            });
          }
        } catch (error: any) {
          // If it's a permission error, Firestore rules aren't set up yet
          // Don't log errors for permission issues - they're expected until rules are set up
          if (error?.code !== 'permission-denied') {
            console.error('Error loading user profile:', error);
          }
          // Fallback to basic user info - this is fine, we'll create the profile on first action
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: 'Farmer',
          });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Auth state listener will update user automatically
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(getFirebaseErrorMessage(error));
    }
  };

  const signup = async (email: string, password: string, fullName?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Trim and validate fullName before saving
      const trimmedName = fullName?.trim();
      const displayName = trimmedName && trimmedName.length > 0 ? trimmedName : undefined;
      
      // Create user profile in Firestore - always Farmer role
      await createUserProfile(userCredential.user.uid, {
        email,
        role: 'Farmer',
        displayName,
      });
      
      // Auth state listener will update user automatically
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(getFirebaseErrorMessage(error));
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // Auth state listener will update user automatically
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(getFirebaseErrorMessage(error));
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
  };

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

