import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import SettingsLayout from '../../components/layout/SettingsLayout';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ToggleSwitch from '../../components/shared/ToggleSwitch';
import SelectField from '../../components/shared/SelectField';
import ConfirmModal from '../../components/shared/ConfirmModal';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { formatDate } from '../../utils/helpers';
import {
  Shield, Bell, Eye, Monitor, Activity, AlertTriangle,
  Lock, Mail, Clock, Check, RotateCcw, GraduationCap,
  Building2, Search, Settings2, Save, UserX, Info, X
} from 'lucide-react';
import DepartmentsManager from '../../components/university/DepartmentsManager';

// ─── Tab definitions per role ───────────────────────────────
const commonTabs = [
  { id: 'security', label: 'Account Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Eye },
  { id: 'display', label: 'Display', icon: Monitor },
  { id: 'activity', label: 'Activity Log', icon: Activity },
  { id: 'danger', label: 'Account Ownership', icon: AlertTriangle },
];

const roleTabs = {
  student:    [{ id: 'role_prefs', label: 'Certificate & Enrollment', icon: GraduationCap }],
  university: [{ id: 'role_prefs', label: 'Institution Preferences', icon: Building2 }],
  verifier:   [{ id: 'role_prefs', label: 'Verification Preferences', icon: Search }],
  admin:      [{ id: 'role_prefs', label: 'System Preferences', icon: Settings2 }],
};

// ─── Password schema ───
const passwordSchema = yup.object().shape({
  current_password:          yup.string().required('Current password is required.'),
  new_password:              yup.string().min(8, 'New password must be at least 8 characters.').required('New password is required.'),
  new_password_confirmation: yup.string().oneOf([yup.ref('new_password'), null], 'Password confirmation does not match.').required('Please confirm your new password.'),
});

// ─── Main component ────────────────────────────────────────
export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || 'security';
  });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['security', 'notifications', 'privacy', 'display', 'activity', 'danger', 'role_prefs'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const [settings, setSettings]           = useState(null);
  const [account, setAccount]             = useState(null);
  const [loading, setLoading]             = useState(true);
  const [saveStatus, setSaveStatus]       = useState('idle'); // idle | saving | saved
  const [activities, setActivities]       = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [page, setPage]                   = useState(1);
  const [showResetModal, setShowResetModal]       = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  // ─── Preferences tab: local draft state (manual save) ──
  const [prefsDraft, setPrefsDraft]       = useState(null);
  const [authorityDraft, setAuthorityDraft] = useState({
    default_authority_name:  '',
    default_authority_title: '',
  });
  const [prefsSaving, setPrefsSaving]     = useState(false);

  const pageSize   = 5;
  const debounceRef = useRef(null);

  const tabs = useMemo(() => {
    const extra  = roleTabs[user?.role] || [];
    const copy   = [...commonTabs];
    const actIdx = copy.findIndex((t) => t.id === 'activity');
    copy.splice(actIdx, 0, ...extra);
    return copy;
  }, [user?.role]);

  // ─── Load settings ──────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/settings');
        setSettings(data.settings);
        setAccount(data.account);
        // Initialise preferences draft from loaded settings
        setPrefsDraft(JSON.parse(JSON.stringify(data.settings)));
      } catch {
        toast.error('Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ─── Load institution authority fields (university only) ──
  useEffect(() => {
    if (user?.role !== 'university') return;
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/profile');
        setAuthorityDraft({
          default_authority_name:  data.profile?.default_authority_name  ?? '',
          default_authority_title: data.profile?.default_authority_title ?? '',
        });
      } catch {
        // Non-fatal — fields will just be empty
      }
    };
    fetchProfile();
  }, [user?.role]);

  // ─── Load activity log when tab selected ────────
  useEffect(() => {
    if (activeTab !== 'activity') return;
    const loadActivity = async () => {
      setActivitiesLoading(true);
      try {
        const { data } = await api.get('/profile/activity');
        setActivities(data.activities || []);
      } catch {
        toast.error('Failed to load account activity.');
      } finally {
        setActivitiesLoading(false);
      }
    };
    loadActivity();
  }, [activeTab]);

  const totalPages     = Math.max(1, Math.ceil(activities.length / pageSize));
  const pagedActivities = useMemo(
    () => activities.slice((page - 1) * pageSize, page * pageSize),
    [activities, page],
  );

  // ─── Auto-save helper (used by General / Notifications / Display / Privacy tabs) ──
  const persistSettings = useCallback(async (partial) => {
    setSaveStatus('saving');
    try {
      const { data } = await api.put('/settings', { settings: partial });
      setSettings(data.settings);
      // Keep prefsDraft in sync with global settings
      setPrefsDraft((prev) => ({ ...prev, ...data.settings }));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('idle');
      toast.error('Failed to save settings.');
    }
  }, []);

  const updateSetting = useCallback((path, value) => {
    const keys = path.split('.');
    const partial = {};
    let cursor = partial;
    for (let i = 0; i < keys.length - 1; i++) {
      cursor[keys[i]] = {};
      cursor = cursor[keys[i]];
    }
    cursor[keys[keys.length - 1]] = value;

    setSettings((prev) => deepSet(prev, path, value));

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => persistSettings(partial), 500);
  }, [persistSettings]);

  // ─── Preferences draft helpers (manual save) ──────────
  const updatePrefsDraft = useCallback((path, value) => {
    setPrefsDraft((prev) => deepSet(prev ?? {}, path, value));
  }, []);

  // ─── Save Preferences handler ──────────────────────────
  const handleSavePreferences = async () => {
    if (!prefsDraft) return;
    setPrefsSaving(true);
    try {
      // Extract only role-relevant preference keys from the draft
      const roleKey = {
        student:    ['certificate_preferences', 'enrollment_preferences', 'profile_privacy'],
        university: ['institution_preferences', 'enrollment_settings'],
        verifier:   ['verification_preferences', 'access_request_settings'],
        admin:      ['system_preferences'],
      }[user?.role] ?? [];

      const partial = {};
      roleKey.forEach((k) => {
        if (prefsDraft[k] !== undefined) partial[k] = prefsDraft[k];
      });

      const promises = [api.put('/settings', { settings: partial })];

      // University: also persist authority fields to institutions table via profile API
      if (user?.role === 'university') {
        promises.push(
          api.put('/profile', {
            default_authority_name:  authorityDraft.default_authority_name,
            default_authority_title: authorityDraft.default_authority_title,
          }),
        );
      }

      const [settingsRes] = await Promise.all(promises);
      setSettings(settingsRes.data.settings);
      setPrefsDraft(JSON.parse(JSON.stringify(settingsRes.data.settings)));
      toast.success('Preferences saved successfully.');
    } catch {
      toast.error('Failed to save preferences.');
    } finally {
      setPrefsSaving(false);
    }
  };

  // ─── Reset handler ─────────────────────────────
  const handleReset = async () => {
    try {
      const { data } = await api.post('/settings/reset');
      setSettings(data.settings);
      setPrefsDraft(JSON.parse(JSON.stringify(data.settings)));
      setShowResetModal(false);
      toast.success('Settings reset to defaults.');
    } catch {
      toast.error('Failed to reset settings.');
    }
  };

  // ─── Password form ──────────────────────────────
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isUpdatingPassword },
    setError: setPasswordFormError,
  } = useForm({ resolver: yupResolver(passwordSchema) });

  const submitPassword = async (data) => {
    try {
      await api.put('/profile/password', {
        current_password:          data.current_password,
        new_password:              data.new_password,
        new_password_confirmation: data.new_password_confirmation,
      });
      resetPassword({ current_password: '', new_password: '', new_password_confirmation: '' });
      toast.success('Password changed successfully.');
    } catch (error) {
      const backendErrors = error.response?.data?.errors || {};
      Object.entries(backendErrors).forEach(([field, messages]) => {
        setPasswordFormError(field, { type: 'server', message: messages[0] });
      });
      toast.error(error.response?.data?.message || 'Failed to change password.');
    }
  };

  // ─── Loading state ──────────────────────────────
  if (loading) {
    return (
      <SettingsLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <LoadingSpinner />
        </div>
      </SettingsLayout>
    );
  }

  // ─── Render ─────────────────────────────────────
  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Settings</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              Account Settings
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your account, notifications, and preferences</p>
          </div>
          <div className="flex items-center gap-3">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 animate-pulse">
                <Clock className="h-3.5 w-3.5" /> Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            )}
            <Button variant="outline" onClick={() => setShowResetModal(true)} className="text-xs">
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reset All
            </Button>
          </div>
        </div>

        {/* Layout: sidebar + content */}
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Sidebar (desktop) / scrollable tabs (mobile) */}
          <nav className="lg:space-y-1 flex gap-1.5 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {tabs.map((tab) => {
              const Icon     = tab.icon;
              const isDanger = tab.id === 'danger';
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSearchParams({ tab: tab.id }); setPage(1); }}
                  className={`
                    flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition
                    ${activeTab === tab.id
                      ? isDanger
                        ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        : 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                      : isDanger
                        ? 'text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Content area */}
          <div className="min-w-0 space-y-6">

            {/* ─── Account Security ─── */}
            {activeTab === 'security' && (
              <>
                {/* Account info */}
                <Card>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account Information</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <InfoRow label="Email"          value={account?.email} />
                    <InfoRow label="Role"           value={account?.role?.charAt(0).toUpperCase() + account?.role?.slice(1)} />
                    <InfoRow label="Status"         value={account?.is_approved ? 'Approved' : 'Pending Approval'} />
                    <InfoRow label="Email Verified" value={account?.email_verified_at ? formatDate(account.email_verified_at) : 'Not verified'} />
                    <InfoRow label="Member Since"   value={account?.created_at ? formatDate(account.created_at) : '-'} />
                  </div>
                </Card>

                {/* Password change */}
                <Card>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Lock className="h-5 w-5 text-gray-400" />
                    Change Password
                  </h2>
                  <form className="mt-6 space-y-4" onSubmit={handleSubmitPassword(submitPassword)}>
                    <Input label="Current Password"      type="password" {...registerPassword('current_password')}          error={passwordErrors.current_password?.message} />
                    <Input label="New Password"          type="password" {...registerPassword('new_password')}              error={passwordErrors.new_password?.message} />
                    <Input label="Confirm New Password"  type="password" {...registerPassword('new_password_confirmation')} error={passwordErrors.new_password_confirmation?.message} />
                    <Button type="submit" loading={isUpdatingPassword}>
                      Update Password
                    </Button>
                  </form>
                </Card>
              </>
            )}

            {/* ─── Notifications ─── */}
            {activeTab === 'notifications' && settings && (
              <>
                <Card>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Mail className="h-5 w-5 text-gray-400" />
                    Email Notifications
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Choose which emails you receive.</p>
                  <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
                    <ToggleSwitch label="Certificate Issued"       description="Receive emails when a new certificate is issued to you"   checked={settings.notifications?.email?.certificate_issued   ?? true} onChange={(v) => updateSetting('notifications.email.certificate_issued', v)} />
                    <ToggleSwitch label="Enrollment Changes"       description="Enrollment status updates and graduation notices"         checked={settings.notifications?.email?.enrollment_changes   ?? true} onChange={(v) => updateSetting('notifications.email.enrollment_changes', v)} />
                    <ToggleSwitch label="Access Requests"          description="When a verifier requests access to your certificates"     checked={settings.notifications?.email?.access_requests      ?? true} onChange={(v) => updateSetting('notifications.email.access_requests', v)} />
                    <ToggleSwitch label="Profile Change Updates"   description="Status updates on profile change requests"               checked={settings.notifications?.email?.profile_changes      ?? true} onChange={(v) => updateSetting('notifications.email.profile_changes', v)} />
                    <ToggleSwitch label="Security Alerts"          description="Login from new devices and password changes"             checked={settings.notifications?.email?.security_alerts      ?? true} onChange={(v) => updateSetting('notifications.email.security_alerts', v)} />
                  </div>
                </Card>

                <Card>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Bell className="h-5 w-5 text-gray-400" />
                    On-Site Notifications
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Control what shows up in your notification panel.</p>
                  <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
                    <ToggleSwitch label="Certificate Issued"     checked={settings.notifications?.in_app?.certificate_issued   ?? true} onChange={(v) => updateSetting('notifications.in_app.certificate_issued', v)} />
                    <ToggleSwitch label="Enrollment Changes"     checked={settings.notifications?.in_app?.enrollment_changes   ?? true} onChange={(v) => updateSetting('notifications.in_app.enrollment_changes', v)} />
                    <ToggleSwitch label="Access Requests"        checked={settings.notifications?.in_app?.access_requests      ?? true} onChange={(v) => updateSetting('notifications.in_app.access_requests', v)} />
                    <ToggleSwitch label="Profile Change Updates" checked={settings.notifications?.in_app?.profile_changes      ?? true} onChange={(v) => updateSetting('notifications.in_app.profile_changes', v)} />
                    <ToggleSwitch label="Security Alerts"        checked={settings.notifications?.in_app?.security_alerts      ?? true} onChange={(v) => updateSetting('notifications.in_app.security_alerts', v)} />
                  </div>
                </Card>
              </>
            )}

            {/* ─── Privacy ─── */}
            {activeTab === 'privacy' && settings && (
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Eye className="h-5 w-5 text-gray-400" />
                  Privacy Settings
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Control who can see your information.</p>
                <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
                  <div className="py-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Profile Visibility</h3>
                    <RadioGroup
                      name="profile_visibility"
                      value={settings.privacy?.profile_visibility || 'public'}
                      onChange={(v) => updateSetting('privacy.profile_visibility', v)}
                      options={[
                        { value: 'public',  label: 'Public',  desc: 'Anyone can view your profile' },
                        { value: 'private', label: 'Private', desc: 'Only you and admins can view' },
                      ]}
                    />
                  </div>
                  <div className="py-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Default Certificate Visibility</h3>
                    <RadioGroup
                      name="certificate_default"
                      value={settings.privacy?.certificate_default || 'public'}
                      onChange={(v) => updateSetting('privacy.certificate_default', v)}
                      options={[
                        { value: 'public',  label: 'Public',  desc: 'Verifiable by anyone' },
                        { value: 'private', label: 'Private', desc: 'Requires your approval' },
                      ]}
                    />
                  </div>
                  <ToggleSwitch label="Show Email to Verifiers" description="Allow verifiers to see your email address"  checked={settings.privacy?.show_email_to_verifiers ?? false} onChange={(v) => updateSetting('privacy.show_email_to_verifiers', v)} />
                  <ToggleSwitch label="Show Phone to Verifiers" description="Allow verifiers to see your phone number"  checked={settings.privacy?.show_phone_to_verifiers ?? false} onChange={(v) => updateSetting('privacy.show_phone_to_verifiers', v)} />
                  {user?.role === 'student' && (
                    <>
                      {/* ── Profile Privacy (student-only) ── */}
                      <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
                          <UserX className="h-4 w-4 text-primary-500" />
                          Profile Privacy
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                          Control who can find you and what verifiers can see about your profile.
                        </p>

                        {/* Profile Visibility dropdown */}
                        <div className="mb-4">
                          <SelectField
                            label="Profile Visibility"
                            value={settings.profile_visibility || 'verifiers_only'}
                            onChange={(v) => updateSetting('profile_visibility', v)}
                            options={[
                              { value: 'public',         label: 'Public — Anyone can view your profile' },
                              { value: 'verifiers_only', label: 'Verifiers Only — Only approved verifiers can view your profile' },
                              { value: 'private',        label: 'Private — Only you and admins can view your profile' },
                            ]}
                          />
                          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                            {settings.profile_visibility === 'public' &&
                              'Your name, institution, and basic details are visible to everyone — including unauthenticated visitors.'}
                            {(settings.profile_visibility === 'verifiers_only' || !settings.profile_visibility) &&
                              'Only approved verifiers who are logged in can view your profile. The general public cannot access it.'}
                            {settings.profile_visibility === 'private' &&
                              'Your profile is completely hidden from verifiers. Only platform administrators retain access.'}
                          </p>
                        </div>

                        {/* Hidden-from-search banner */}
                        <ProfilePrivacyBanner
                          hidden={!(settings.allow_verifier_search ?? true)}
                        />

                        {/* Toggles */}
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                          <ToggleSwitch
                            label="Allow verifiers to find me in search"
                            description="When off, verifiers cannot discover you by searching your student ID, NID, or email — they can only reach you via a direct link you share."
                            checked={settings.allow_verifier_search ?? true}
                            onChange={(v) => updateSetting('allow_verifier_search', v)}
                          />
                          <ToggleSwitch
                            label="Show my email to verifiers who access my profile"
                            description="When on, verifiers who view your profile or see you in search results will be able to see your email address."
                            checked={settings.show_email_to_verifiers ?? false}
                            onChange={(v) => updateSetting('show_email_to_verifiers', v)}
                          />
                          <ToggleSwitch
                            label="Show my current institution publicly"
                            description="When on, the name of your enrolled institution is displayed on your profile. Turn off to keep your academic affiliation private."
                            checked={settings.show_institution_to_public ?? true}
                            onChange={(v) => updateSetting('show_institution_to_public', v)}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {user?.role === 'student' && (
                    <ToggleSwitch
                      label="Allow Universities to Search Me"
                      description="Let universities find you by name or NID for enrollment"
                      checked={settings.privacy?.allow_university_search ?? true}
                      onChange={(v) => updateSetting('privacy.allow_university_search', v)}
                    />
                  )}
                </div>
              </Card>
            )}

            {/* ─── Display ─── */}
            {activeTab === 'display' && settings && (
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-gray-400" />
                  Display Preferences
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Customize how the application looks.</p>
                <div className="mt-6 space-y-6">
                  {/* Theme selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">Theme</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'light',  label: 'Light',  emoji: '☀️' },
                        { value: 'dark',   label: 'Dark',   emoji: '🌙' },
                        { value: 'system', label: 'System', emoji: '💻' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setTheme(opt.value);
                            updateSetting('display.theme', opt.value);
                          }}
                          className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition ${
                            theme === opt.value
                              ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 shadow-sm'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-600'
                          }`}
                        >
                          <span className="text-xl">{opt.emoji}</span>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <SelectField
                    label="Date Format"
                    value={settings.display?.date_format || 'DD/MM/YYYY'}
                    onChange={(v) => updateSetting('display.date_format', v)}
                    options={[
                      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2026)' },
                      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2026)' },
                      { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2026-12-31)' },
                    ]}
                  />

                  <SelectField
                    label="Timezone"
                    value={settings.display?.timezone || 'Asia/Dhaka'}
                    onChange={(v) => updateSetting('display.timezone', v)}
                    options={[
                      { value: 'Asia/Dhaka',        label: 'Asia/Dhaka (UTC+6)' },
                      { value: 'Asia/Kolkata',       label: 'Asia/Kolkata (UTC+5:30)' },
                      { value: 'UTC',                label: 'UTC (UTC+0)' },
                      { value: 'America/New_York',   label: 'America/New_York (UTC-5)' },
                      { value: 'Europe/London',      label: 'Europe/London (UTC+0)' },
                    ]}
                  />

                  <SelectField
                    label="Items Per Page"
                    description="Default number of items shown in paginated lists"
                    value={String(settings.display?.items_per_page || 25)}
                    onChange={(v) => updateSetting('display.items_per_page', parseInt(v, 10))}
                    options={[
                      { value: '10',  label: '10 items' },
                      { value: '25',  label: '25 items' },
                      { value: '50',  label: '50 items' },
                      { value: '100', label: '100 items' },
                    ]}
                  />
                </div>
              </Card>
            )}

            {/* ─── Role-specific Preferences (manual save) ─── */}
            {activeTab === 'role_prefs' && prefsDraft && (
              <>
                {user?.role === 'student' && (
                  <StudentPreferences
                    draft={prefsDraft}
                    updateDraft={updatePrefsDraft}
                  />
                )}
                {user?.role === 'university' && (
                  <UniversityPreferences
                    draft={prefsDraft}
                    updateDraft={updatePrefsDraft}
                    authorityDraft={authorityDraft}
                    setAuthorityDraft={setAuthorityDraft}
                  />
                )}
                {user?.role === 'verifier' && (
                  <VerifierPreferences
                    draft={prefsDraft}
                    updateDraft={updatePrefsDraft}
                  />
                )}
                {user?.role === 'admin' && (
                  <AdminPreferences
                    draft={prefsDraft}
                    updateDraft={updatePrefsDraft}
                  />
                )}

                {/* ── Save Preferences button ── */}
                <div className="flex items-center justify-end gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Changes are not saved automatically in this tab.</p>
                  <Button
                    onClick={handleSavePreferences}
                    loading={prefsSaving}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Preferences
                  </Button>
                </div>
              </>
            )}

            {/* ─── Activity Log ─── */}
            {activeTab === 'activity' && (
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-gray-400" />
                  Activity Log
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Recent account activity and security events.</p>
                {activitiesLoading ? (
                  <div className="mt-6 flex min-h-[20vh] items-center justify-center">
                    <LoadingSpinner />
                  </div>
                ) : activities.length === 0 ? (
                  <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">No account activity yet.</p>
                ) : (
                  <>
                    <div className="mt-6 overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            <th className="py-3 pr-4">Action</th>
                            <th className="py-3 pr-4">Description</th>
                            <th className="py-3 pr-4">Date</th>
                            <th className="py-3">IP</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
                          {pagedActivities.map((activity) => (
                            <tr key={activity.id}>
                              <td className="py-3 pr-4 font-medium text-gray-800 dark:text-gray-200">{activity.action}</td>
                              <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">{activity.description}</td>
                              <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">{formatDate(activity.date)}</td>
                              <td className="py-3 text-gray-600 dark:text-gray-300">{activity.ip_address || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</p>
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))}         disabled={page <= 1}>Previous</Button>
                        <Button variant="secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
                      </div>
                    </div>
                  </>
                )}
              </Card>
            )}

            {/* ─── Account Ownership ─── */}
            {activeTab === 'danger' && (
              <Card className="border-2 border-red-200 dark:border-red-900/50">
                <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Account Ownership
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">These actions are irreversible. Proceed with caution.</p>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-red-200 p-4 dark:border-red-900/50">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Deactivate Account</h3>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Temporarily disable your account. You can reactivate later.</p>
                    </div>
                    <Button variant="danger" onClick={() => setShowDeactivateModal(true)} className="shrink-0">
                      Deactivate
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-red-200 p-4 dark:border-red-900/50">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Delete Account</h3>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Permanently delete your account and all data. This requires admin approval.</p>
                    </div>
                    <Button variant="danger" onClick={() => toast.error('Account deletion requires admin approval. Please contact support.')} className="shrink-0">
                      Request Deletion
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Modals */}
        <ConfirmModal
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
          onConfirm={handleReset}
          title="Reset All Settings"
          message="This will reset all your settings to their default values. This cannot be undone."
          confirmText="Reset Settings"
          variant="danger"
        />
        <ConfirmModal
          isOpen={showDeactivateModal}
          onClose={() => setShowDeactivateModal(false)}
          onConfirm={() => {
            setShowDeactivateModal(false);
            toast.error('Account deactivation requires admin approval. Please contact support.');
          }}
          title="Deactivate Account"
          message="Your account will be temporarily disabled. You will not be able to login until reactivated by an administrator."
          confirmText="Deactivate"
          variant="danger"
        />
      </div>
    </SettingsLayout>
  );
}

// ─── Sub-components ────────────────────────────────────────

function InfoRow({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">{value || '-'}</p>
    </div>
  );
}

function RadioGroup({ value, onChange, options, name }) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label
          key={opt.value}
          className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600 p-3 transition"
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</p>
            {opt.desc && <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>}
          </div>
        </label>
      ))}
    </div>
  );
}

// ─── Role-specific preference panels (draft-based, manual save) ──────────────

// ── Student ──────────────────────────────────────────────────────────────────
function StudentPreferences({ draft, updateDraft }) {
  return (
    <>
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-gray-400" />
          Certificate Preferences
        </h2>
        <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
          {/* default_certificate_visibility */}
          <div className="py-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Default Certificate Visibility</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Visibility applied to newly issued certificates</p>
            <RadioGroup
              name="pref_default_visibility"
              value={draft.certificate_preferences?.default_visibility || 'private'}
              onChange={(v) => updateDraft('certificate_preferences.default_visibility', v)}
              options={[
                { value: 'public',  label: 'Public',  desc: 'Verifiable by anyone' },
                { value: 'private', label: 'Private', desc: 'Requires your approval before access' },
              ]}
            />
          </div>

          {/* auto_approve_access_requests */}
          <ToggleSwitch
            label="Auto-approve Verifier Requests"
            description="Automatically approve access requests from verifiers without manual review"
            checked={draft.certificate_preferences?.auto_approve_verifier ?? false}
            onChange={(v) => updateDraft('certificate_preferences.auto_approve_verifier', v)}
          />

          {/* default_access_duration_days */}
          <div className="py-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Default Access Duration</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">How long verifiers can access your certificates by default</p>
            <RadioGroup
              name="pref_access_duration"
              value={String(draft.certificate_preferences?.default_access_duration ?? 30)}
              onChange={(v) => updateDraft('certificate_preferences.default_access_duration', parseInt(v, 10))}
              options={[
                { value: '7',  label: '7 days',  desc: 'Short-term access' },
                { value: '30', label: '30 days', desc: 'Standard access' },
                { value: '90', label: '90 days', desc: 'Extended access' },
              ]}
            />
          </div>

          <ToggleSwitch
            label="Notify When Certificate is Viewed"
            description="Get notified when someone views your certificate"
            checked={draft.certificate_preferences?.notify_certificate_viewed ?? true}
            onChange={(v) => updateDraft('certificate_preferences.notify_certificate_viewed', v)}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Enrollment Preferences</h2>
        <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
          <ToggleSwitch
            label="Notify on Status Changes"
            description="Get notified when your enrollment status changes"
            checked={draft.enrollment_preferences?.notify_status_changes ?? true}
            onChange={(v) => updateDraft('enrollment_preferences.notify_status_changes', v)}
          />
          <ToggleSwitch
            label="Notify on Graduation Date Extension"
            description="Get notified when your graduation date is extended"
            checked={draft.enrollment_preferences?.notify_graduation_extended ?? true}
            onChange={(v) => updateDraft('enrollment_preferences.notify_graduation_extended', v)}
          />
        </div>
      </Card>
    </>
  );
}

// ── University ───────────────────────────────────────────────────────────────
function UniversityPreferences({ draft, updateDraft, authorityDraft, setAuthorityDraft }) {
  return (
    <>
      <DepartmentsManager />

      {/* Authority defaults — stored on institutions table, synced via profile API */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Building2 className="h-5 w-5 text-gray-400" />
          Certificate Authority Defaults
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          These values auto-fill the "Issued by" fields when you issue a certificate.
        </p>
        <div className="mt-6 space-y-4">
          <Input
            label="Default Authority Name"
            placeholder="e.g. Prof. Dr. John Doe"
            value={authorityDraft.default_authority_name}
            onChange={(e) => setAuthorityDraft((prev) => ({ ...prev, default_authority_name: e.target.value }))}
          />
          <Input
            label="Default Authority Title"
            placeholder="e.g. Vice-Chancellor"
            value={authorityDraft.default_authority_title}
            onChange={(e) => setAuthorityDraft((prev) => ({ ...prev, default_authority_title: e.target.value }))}
          />
        </div>
      </Card>

      {/* Institution Preferences */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Building2 className="h-5 w-5 text-gray-400" />
          Institution Preferences
        </h2>
        <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
          {/* auto_graduate_on_certificate_issue */}
          <ToggleSwitch
            label="Auto-graduate on Certificate Issuance"
            description="Automatically mark students as graduated when their certificate is issued"
            checked={draft.institution_preferences?.auto_graduate_on_certificate ?? true}
            onChange={(v) => updateDraft('institution_preferences.auto_graduate_on_certificate', v)}
          />

          <ToggleSwitch
            label="Auto-generate Student IDs"
            description="Automatically generate student IDs when enrolling students"
            checked={draft.institution_preferences?.auto_generate_student_ids ?? true}
            onChange={(v) => updateDraft('institution_preferences.auto_generate_student_ids', v)}
          />

          {/* student_id_format */}
          <div className="py-3 space-y-1">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Student ID Format</label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Template for auto-generated IDs. Use <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">{'{{YEAR}}'}</code> and <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">{'{{SEQ}}'}</code> as placeholders — e.g. <span className="font-mono">UIU-{'{{YEAR}}'}-{'{{SEQ}}'}</span>
            </p>
            <input
              type="text"
              value={draft.institution_preferences?.student_id_format ?? ''}
              onChange={(e) => updateDraft('institution_preferences.student_id_format', e.target.value || null)}
              placeholder="e.g. UIU-{{YEAR}}-{{SEQ}}"
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="py-3 space-y-1">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Student ID Prefix</label>
            <p className="text-xs text-gray-500 dark:text-gray-400">Short prefix for auto-generated IDs (e.g., STU, AIUB)</p>
            <input
              type="text"
              value={draft.institution_preferences?.student_id_prefix ?? ''}
              onChange={(e) => updateDraft('institution_preferences.student_id_prefix', e.target.value.toUpperCase())}
              placeholder="e.g., STU"
              maxLength={10}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="py-3">
            <SelectField
              label="Default Certificate Prefix"
              description="Prefix used in certificate serial numbers"
              value={draft.institution_preferences?.default_certificate_prefix || 'BSC'}
              onChange={(v) => updateDraft('institution_preferences.default_certificate_prefix', v)}
              options={[
                { value: 'BSC', label: 'BSC (Bachelor of Science)' },
                { value: 'MSC', label: 'MSC (Master of Science)' },
                { value: 'PHD', label: 'PHD (Doctor of Philosophy)' },
                { value: 'BBA', label: 'BBA (Bachelor of Business)' },
                { value: 'MBA', label: 'MBA (Master of Business)' },
              ]}
            />
          </div>

          <div className="py-3">
            <SelectField
              label="Default Session Duration"
              description="Expected duration of academic programs"
              value={String(draft.enrollment_settings?.default_session_duration_years || 4)}
              onChange={(v) => updateDraft('enrollment_settings.default_session_duration_years', parseInt(v, 10))}
              options={[
                { value: '1', label: '1 year' },
                { value: '2', label: '2 years' },
                { value: '3', label: '3 years' },
                { value: '4', label: '4 years' },
                { value: '5', label: '5 years' },
                { value: '6', label: '6 years' },
              ]}
            />
          </div>
        </div>
      </Card>
    </>
  );
}

// ── Verifier ─────────────────────────────────────────────────────────────────
function VerifierPreferences({ draft, updateDraft }) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Search className="h-5 w-5 text-gray-400" />
        Verification Preferences
      </h2>
      <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
        {/* auto_log_verifications */}
        <ToggleSwitch
          label="Auto-log All Verifications"
          description="Automatically log every verification you perform"
          checked={draft.verification_preferences?.auto_log_verifications ?? true}
          onChange={(v) => updateDraft('verification_preferences.auto_log_verifications', v)}
        />

        {/* require_verification_notes */}
        <ToggleSwitch
          label="Require Note for Each Verification"
          description="Prompt for a note before each verification is submitted"
          checked={draft.verification_preferences?.require_note ?? false}
          onChange={(v) => updateDraft('verification_preferences.require_note', v)}
        />

        {/* default_verification_method: manual / qr / link */}
        <div className="py-3">
          <SelectField
            label="Default Verification Method"
            description="Preferred method for verifying certificates"
            value={draft.verification_preferences?.default_method || 'manual'}
            onChange={(v) => updateDraft('verification_preferences.default_method', v)}
            options={[
              { value: 'manual', label: 'Manual — Enter serial & date of birth' },
              { value: 'qr',     label: 'QR Code — Scan certificate QR code' },
              { value: 'link',   label: 'Link — Use verification link' },
            ]}
          />
        </div>

        <ToggleSwitch
          label="Notify When Access Expires"
          description="Receive notifications before your access to student certificates expires"
          checked={draft.verification_preferences?.notify_access_expires ?? true}
          onChange={(v) => updateDraft('verification_preferences.notify_access_expires', v)}
        />

        <div className="py-3">
          <SelectField
            label="Default Access Request Duration"
            description="Default duration when requesting access to student certificates"
            value={String(draft.access_request_settings?.default_duration_days ?? 30)}
            onChange={(v) => updateDraft('access_request_settings.default_duration_days', parseInt(v, 10))}
            options={[
              { value: '7',   label: '7 days' },
              { value: '30',  label: '30 days' },
              { value: '90',  label: '90 days' },
              { value: '180', label: '180 days' },
              { value: '365', label: '1 year' },
            ]}
          />
        </div>
      </div>
    </Card>
  );
}

// ── Admin ─────────────────────────────────────────────────────────────────────
function AdminPreferences({ draft, updateDraft }) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Settings2 className="h-5 w-5 text-gray-400" />
        System Preferences
      </h2>
      <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
        {/* require_approval_for_universities */}
        <ToggleSwitch
          label="Require Approval for Universities"
          description="New university registrations must be reviewed and approved by an admin"
          checked={draft.system_preferences?.require_approval_universities ?? true}
          onChange={(v) => updateDraft('system_preferences.require_approval_universities', v)}
        />

        {/* require_approval_for_verifiers */}
        <ToggleSwitch
          label="Require Approval for Verifiers"
          description="New verifier registrations must be reviewed and approved by an admin"
          checked={draft.system_preferences?.require_approval_verifiers ?? true}
          onChange={(v) => updateDraft('system_preferences.require_approval_verifiers', v)}
        />

        <ToggleSwitch
          label="Require Admin Approval for All New Users"
          description="All new registrations must be reviewed and approved by an admin"
          checked={draft.system_preferences?.require_approval_new_users ?? true}
          onChange={(v) => updateDraft('system_preferences.require_approval_new_users', v)}
        />

        <ToggleSwitch
          label="Auto-approve Verified Emails"
          description="Automatically approve users who have verified their email address"
          checked={draft.system_preferences?.auto_approve_verified_emails ?? false}
          onChange={(v) => updateDraft('system_preferences.auto_approve_verified_emails', v)}
        />

        <ToggleSwitch
          label="Daily Summary Report"
          description="Receive a daily email summary of system activity"
          checked={draft.system_preferences?.daily_summary_report ?? true}
          onChange={(v) => updateDraft('system_preferences.daily_summary_report', v)}
        />

        <div className="py-3">
          <SelectField
            label="Profile Change Auto-Approve"
            description="Automatically approve profile change requests by type"
            value={draft.system_preferences?.profile_change_auto_approve || 'never'}
            onChange={(v) => updateDraft('system_preferences.profile_change_auto_approve', v)}
            options={[
              { value: 'never',        label: 'Never — All changes require manual approval' },
              { value: 'email',        label: 'Email changes only' },
              { value: 'phone',        label: 'Phone changes only' },
              { value: 'email_phone',  label: 'Email and phone changes' },
            ]}
          />
        </div>
      </div>
    </Card>
  );
}

// ─── Profile Privacy Banner ─────────────────────────────────
function ProfilePrivacyBanner({ hidden }) {
  const [dismissed, setDismissed] = useState(false);

  if (!hidden || dismissed) return null;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-700/50 dark:bg-amber-900/20">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="flex-1 text-amber-800 dark:text-amber-300">
        <span className="font-semibold">You are hidden from verifier searches.</span>{' '}
        Verifiers cannot request access to your certificates unless you share your direct profile link.
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-0.5 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-800/40"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Utility ────────────────────────────────────────────────

function deepSet(obj, path, value) {
  const keys = path.split('.');
  const copy  = JSON.parse(JSON.stringify(obj || {}));
  let cursor  = copy;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!cursor[keys[i]] || typeof cursor[keys[i]] !== 'object') {
      cursor[keys[i]] = {};
    }
    cursor = cursor[keys[i]];
  }
  cursor[keys[keys.length - 1]] = value;
  return copy;
}
