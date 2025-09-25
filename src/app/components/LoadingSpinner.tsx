import React from "react";

const LoadingSpinner = () => (
  <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
      <p className="mt-4 text-white">Loading...</p>
    </div>
  </div>
);

export default LoadingSpinner;
