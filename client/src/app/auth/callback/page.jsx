"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import apiService from "@/lib/api";
import websocketService from "@/lib/websocket";
import { toast } from "react-hot-toast";

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(null);

  const handleOAuthCallback = useCallback(async () => {
    try {
      // Extract tokens from URL parameters
      const accessToken = searchParams.get("accessToken");
      const refreshToken = searchParams.get("refreshToken");
      const errorParam = searchParams.get("error");

      if (errorParam) {
        throw new Error(decodeURIComponent(errorParam));
      }

      if (!accessToken || !refreshToken) {
        throw new Error("Missing authentication tokens");
      }

      // Store tokens using API service
      apiService.setTokens(accessToken, refreshToken);

      // Get user information
      const user = await apiService.getCurrentUser();

      // Initialize WebSocket connection
      try {
        await websocketService.connect(accessToken);
      } catch (wsError) {
        console.warn("WebSocket connection failed:", wsError);
        // Don't block login for WebSocket failure
      }

      toast.success(`Welcome back, ${user.name}!`);

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Authentication failed";
      console.error("OAuth callback error:", err);
      setError(errorMessage);
      toast.error(errorMessage);

      // Clear any partial tokens
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      // Redirect to login after a delay
      setTimeout(() => {
        router.push("/login?error=oauth_failed");
      }, 3000);
    }
  }, [searchParams, router]);

  useEffect(() => {
    handleOAuthCallback();
  }, [handleOAuthCallback]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Authentication Failed
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="text-sm text-gray-500">
            Redirecting to login page in 3 seconds...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-10 h-10 text-white animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Completing Sign In
        </h1>
        <p className="text-gray-600 mb-6">
          We're setting up your account. Please wait...
        </p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense>
      <OAuthCallbackContent />
    </Suspense>
  );
}
