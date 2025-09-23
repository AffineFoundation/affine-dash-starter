import React from 'react';

interface Environment {
  id: string;
  name: string;
  description: string;
  repoUrl: string;
  models: any[];
}

interface EnvironmentTabsProps {
  environments: Environment[];
  activeEnvironment: string;
  setActiveEnvironment: (id: string) => void;
  theme: 'light' | 'dark';
}

const EnvironmentTabs: React.FC<EnvironmentTabsProps> = ({
  environments,
  activeEnvironment,
  setActiveEnvironment,
  theme
}) => {
  return (
    <div className="mb-6">
      <div className="flex gap-0 border-2 border-b-0 rounded-none overflow-hidden">
        {environments.map((env) => (
          <button
            key={env.id}
            onClick={() => setActiveEnvironment(env.id)}
            className={`px-6 py-3 font-sans text-xs uppercase tracking-wider border-r-2 last:border-r-0 transition-colors ${
              activeEnvironment === env.id
                ? 'bg-white text-gray-900 border-gray-300 dark:bg-gray-800 dark:text-white dark:border-white'
                : 'bg-slate-100 text-gray-600 border-gray-300 hover:bg-white hover:text-gray-800 dark:bg-black dark:text-gray-300 dark:border-white dark:hover:bg-gray-800 dark:hover:text-white'
            }`}
          >
            {env.name}
            <div className="text-xs mt-1 font-sans text-gray-500 dark:text-gray-400">
              {env.models.length} MODELS
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EnvironmentTabs;

