"use client";

import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

/**
 * Wrapper component that ensures Firebase authentication is initialized
 * before rendering children. Uses anonymous auth for seamless UX.
 */
export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading, error } = useFirebaseAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Initializing game...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center max-w-md px-4">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // User is authenticated (anonymously) - render the app
  return <>{children}</>;
}
