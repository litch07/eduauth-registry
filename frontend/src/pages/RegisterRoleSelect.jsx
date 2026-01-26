import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Building, UserCheck, ArrowRight, CheckCircle } from 'lucide-react';

const RegisterRoleSelect = () => {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'student',
      title: 'Student',
      description: 'Register to receive and manage your academic certificates',
      icon: GraduationCap,
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
      features: [
        'View all your certificates',
        'Manage sharing settings',
        'Track verification history',
        'Grant access to verifiers'
      ],
      path: '/register/student'
    },
    {
      id: 'university',
      title: 'University',
      description: 'Register your institution to issue verified certificates',
      icon: Building,
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700',
      features: [
        'Issue digital certificates',
        'Enroll students',
        'Manage enrollments',
        'Track certificate issuance'
      ],
      path: '/register/university'
    },
    {
      id: 'verifier',
      title: 'Verifier / Employer',
      description: 'Register as an organization to verify student certificates',
      icon: UserCheck,
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700',
      features: [
        'Search student records',
        'Request certificate access',
        'View approved certificates',
        'Background verification'
      ],
      path: '/register/verifier'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 px-4 py-10 text-slate-900 dark:text-white">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <img 
              src="/assets/logo.png" 
              alt="EduAuth Registry" 
              className="h-16 w-16 object-cover rounded-2xl shadow-lg ring-2 ring-primary/20" 
            />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
            Join EduAuth Registry
          </h1>
          <p className="mt-2 text-slate-600 dark:text-gray-300 md:text-lg">
            Choose your account type to get started
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.id}
                className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg ring-1 ring-slate-200 dark:ring-gray-700 transition-all hover:shadow-xl hover:ring-primary/30"
              >
                {/* Gradient Header */}
                <div className={`bg-gradient-to-r ${role.color} px-6 py-5 text-white`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{role.title}</h3>
                      <p className="text-sm text-white/90">Registration</p>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  <p className="mb-4 text-sm text-slate-600 dark:text-gray-300">
                    {role.description}
                  </p>

                  {/* Features List */}
                  <ul className="mb-6 space-y-2">
                    {role.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-slate-700 dark:text-gray-200">
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Register Button */}
                  <button
                    onClick={() => navigate(role.path)}
                    className={`flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r ${role.color} ${role.hoverColor} px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all`}
                  >
                    Register as {role.title}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-slate-600 dark:text-gray-300">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="font-semibold text-primary hover:text-primary-hover transition"
            >
              Sign In
            </Link>
          </p>
          <Link 
            to="/" 
            className="mt-3 inline-block text-sm font-semibold text-secondary hover:text-secondary-hover transition"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterRoleSelect;
