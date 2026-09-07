import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  AuthError,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export type AuthModalMode = 'create' | 'signin';

export const ONBOARDING_STORAGE_KEY = 'later_onboarding_completed_v1';
export const FEATURE_TOUR_STORAGE_KEY = 'later_feature_tour_completed_v1';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  hasSeenOnboarding: boolean | null;
  hasSeenFeatureTour: boolean | null;
  isCreateAccountOpen: boolean;
  setIsCreateAccountOpen: (open: boolean) => void;
  authModalMode: AuthModalMode;
  setAuthModalMode: (mode: AuthModalMode) => void;
  openAuthModal: (mode?: AuthModalMode) => void;
  createAccount: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  signOutUser: () => Promise<{ success: boolean; error?: string }>;
  markOnboardingComplete: () => Promise<void>;
  markFeatureTourComplete: () => Promise<void>;
  resetFeatureTour: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const mapAuthErrorToMessage = (error: unknown): string => {
  if (!error || typeof error !== 'object') {
    return 'An unexpected error occurred. Please try again.';
  }

  const authError = error as AuthError;
  const code = authError.code;

  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists.';
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please check your credentials and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network connection failure. Please check your internet connection.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled for this project.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment before trying again.';
    default:
      return authError.message || 'Authentication failed. Please try again.';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [hasSeenFeatureTour, setHasSeenFeatureTour] = useState<boolean | null>(null);
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('create');

  const openAuthModal = (mode: AuthModalMode = 'create') => {
    setAuthModalMode(mode);
    setIsCreateAccountOpen(true);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
              const data = userSnap.data();
              const seenOnboarding = data.hasSeenOnboarding === true;
              const seenTour = data.hasSeenFeatureTour === true;
              setHasSeenOnboarding(seenOnboarding);
              setHasSeenFeatureTour(seenTour);
              if (seenOnboarding) {
                try {
                  localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
                } catch {
                  // ignore
                }
              }
              if (seenTour) {
                try {
                  localStorage.setItem(FEATURE_TOUR_STORAGE_KEY, 'true');
                } catch {
                  // ignore
                }
              }
            } else {
              // No user document yet: transfer guest onboarding & tour status if already completed
              const guestSeenOnboarding =
                typeof window !== 'undefined' &&
                localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
              const guestSeenTour =
                typeof window !== 'undefined' &&
                localStorage.getItem(FEATURE_TOUR_STORAGE_KEY) === 'true';

              setHasSeenOnboarding(guestSeenOnboarding);
              setHasSeenFeatureTour(guestSeenTour);

              try {
                await setDoc(
                  userDocRef,
                  {
                    hasSeenOnboarding: guestSeenOnboarding,
                    hasSeenFeatureTour: guestSeenTour,
                    email: currentUser.email,
                    createdAt: new Date().toISOString(),
                  },
                  { merge: true }
                );
              } catch (writeErr) {
                console.warn('Initial user profile write notice:', writeErr);
              }
            }
          } catch (err) {
            console.error('Failed to read user profile from Firestore:', err);
            const guestSeenOnboarding =
              typeof window !== 'undefined' &&
              localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
            const guestSeenTour =
              typeof window !== 'undefined' &&
              localStorage.getItem(FEATURE_TOUR_STORAGE_KEY) === 'true';

            setHasSeenOnboarding(guestSeenOnboarding);
            setHasSeenFeatureTour(guestSeenTour);
          }
        } else {
          setHasSeenOnboarding(null);
          // For guests, check localStorage directly
          const guestSeenTour =
            typeof window !== 'undefined' &&
            localStorage.getItem(FEATURE_TOUR_STORAGE_KEY) === 'true';
          setHasSeenFeatureTour(guestSeenTour);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Firebase Auth state error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const markOnboardingComplete = async () => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
    setHasSeenOnboarding(true);

    if (user?.uid) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(
          userDocRef,
          {
            hasSeenOnboarding: true,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('Failed to save hasSeenOnboarding to Firestore:', err);
      }
    }
  };

  const markFeatureTourComplete = async () => {
    try {
      localStorage.setItem(FEATURE_TOUR_STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
    setHasSeenFeatureTour(true);

    if (user?.uid) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(
          userDocRef,
          {
            hasSeenFeatureTour: true,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('Failed to save hasSeenFeatureTour to Firestore:', err);
      }
    }
  };

  const resetFeatureTour = async () => {
    try {
      localStorage.removeItem(FEATURE_TOUR_STORAGE_KEY);
    } catch {
      // ignore
    }
    setHasSeenFeatureTour(false);

    if (user?.uid) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(
          userDocRef,
          {
            hasSeenFeatureTour: false,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('Failed to reset hasSeenFeatureTour in Firestore:', err);
      }
    }
  };

  const createAccount = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const guestSeenOnboarding =
        typeof window !== 'undefined' &&
        localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
      const guestSeenTour =
        typeof window !== 'undefined' &&
        localStorage.getItem(FEATURE_TOUR_STORAGE_KEY) === 'true';

      if (userCredential.user) {
        try {
          await setDoc(
            doc(db, 'users', userCredential.user.uid),
            {
              hasSeenOnboarding: guestSeenOnboarding,
              hasSeenFeatureTour: guestSeenTour,
              email: userCredential.user.email,
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (writeErr) {
          console.warn('Failed to persist onboarding/tour on signup:', writeErr);
        }
        setHasSeenOnboarding(guestSeenOnboarding);
        setHasSeenFeatureTour(guestSeenTour);
      }

      return { success: true, user: userCredential.user };
    } catch (err: unknown) {
      const message = mapAuthErrorToMessage(err);
      return { success: false, error: message };
    }
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (userCredential.user) {
        try {
          const userSnap = await getDoc(doc(db, 'users', userCredential.user.uid));
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data?.hasSeenOnboarding === true) {
              setHasSeenOnboarding(true);
              try {
                localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
              } catch {
                // ignore
              }
            }
            if (data?.hasSeenFeatureTour === true) {
              setHasSeenFeatureTour(true);
              try {
                localStorage.setItem(FEATURE_TOUR_STORAGE_KEY, 'true');
              } catch {
                // ignore
              }
            }
          }
        } catch (e) {
          console.warn('Failed to query onboarding/tour state on sign in:', e);
        }
      }
      return { success: true, user: userCredential.user };
    } catch (err: unknown) {
      const message = mapAuthErrorToMessage(err);
      return { success: false, error: message };
    }
  };

  const signOutUser = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await signOut(auth);
      setHasSeenOnboarding(null);
      const guestSeenTour =
        typeof window !== 'undefined' &&
        localStorage.getItem(FEATURE_TOUR_STORAGE_KEY) === 'true';
      setHasSeenFeatureTour(guestSeenTour);
      return { success: true };
    } catch (err: unknown) {
      console.error('Sign out error:', err);
      const message = mapAuthErrorToMessage(err);
      return { success: false, error: message || 'Sign out failed — please try again' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        hasSeenOnboarding,
        hasSeenFeatureTour,
        isCreateAccountOpen,
        setIsCreateAccountOpen,
        authModalMode,
        setAuthModalMode,
        openAuthModal,
        createAccount,
        signIn,
        signOutUser,
        markOnboardingComplete,
        markFeatureTourComplete,
        resetFeatureTour,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
