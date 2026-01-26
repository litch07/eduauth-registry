import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Construction, ArrowLeft } from 'lucide-react';

const UnderConstruction = ({ title = 'Feature Under Construction', description = 'This feature is currently being developed.' }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-10 text-slate-900 dark:text-white">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300 shadow-lg">
            <Construction className="h-8 w-8" />
          </div>
        </div>
        
        <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">{title}</h1>
        <p className="mb-8 text-slate-600 dark:text-gray-300">{description}</p>
        
        <p className="mb-6 text-sm text-slate-500 dark:text-gray-400">
          We're working hard to bring this feature to you. Please check back soon!
        </p>

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </button>
      </div>
    </div>
  );
};

export default UnderConstruction;
