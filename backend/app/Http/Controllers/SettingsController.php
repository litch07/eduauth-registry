<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\UserSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SettingsController extends Controller
{
    /**
     * Get user settings (creates with defaults if none exist).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $setting = UserSetting::firstOrCreate(
            ['user_id' => $user->id],
            ['preferences' => UserSetting::getDefaults($user->role)]
        );

        // Ensure any new default keys are present (in case defaults were expanded)
        $defaults = UserSetting::getDefaults($user->role);
        $merged = UserSetting::deepMerge($defaults, $setting->preferences ?? []);

        // Clean up legacy keys if they exist in DB JSON
        if (isset($merged['privacy']['profile_visibility'])) unset($merged['privacy']['profile_visibility']);
        if (isset($merged['privacy']['show_email_to_verifiers'])) unset($merged['privacy']['show_email_to_verifiers']);
        if (isset($merged['profile_privacy'])) unset($merged['profile_privacy']);

        if ($merged !== ($setting->preferences ?? [])) {
            $setting->update(['preferences' => $merged]);
        }

        // Merge direct columns into the root of the settings response
        $settingsData = $merged;
        $settingsData['profile_visibility'] = $setting->profile_visibility ?? 'verifiers_only';
        $settingsData['allow_verifier_search'] = (bool) ($setting->allow_verifier_search ?? true);
        $settingsData['show_email_to_verifiers'] = (bool) ($setting->show_email_to_verifiers ?? false);
        $settingsData['show_institution_to_public'] = (bool) ($setting->show_institution_to_public ?? true);

        return response()->json([
            'success' => true,
            'settings' => $settingsData,
            'role' => $user->role,
            'account' => [
                'email' => $user->email,
                'role' => $user->role,
                'is_approved' => $user->is_approved,
                'email_verified_at' => $user->email_verified_at?->toDateTimeString(),
                'created_at' => $user->created_at?->toDateTimeString(),
                'updated_at' => $user->updated_at?->toDateTimeString(),
            ],
        ]);
    }

    /**
     * Update settings (partial deep merge).
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'settings' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $inputSettings = $request->input('settings');
        
        $directColumns = [];
        $columns = ['profile_visibility', 'allow_verifier_search', 'show_email_to_verifiers', 'show_institution_to_public'];
        
        foreach ($columns as $col) {
            if (array_key_exists($col, $inputSettings)) {
                $directColumns[$col] = $inputSettings[$col];
                unset($inputSettings[$col]);
            }
        }
        
        // Remove from nested privacy arrays if sent by accident
        if (isset($inputSettings['privacy'])) {
            foreach ($columns as $col) {
                unset($inputSettings['privacy'][$col]);
            }
        }
        unset($inputSettings['profile_privacy']);

        $setting = UserSetting::firstOrCreate(
            ['user_id' => $user->id],
            ['preferences' => UserSetting::getDefaults($user->role)]
        );

        $current = $setting->preferences ?? UserSetting::getDefaults($user->role);
        $updated = UserSetting::deepMerge($current, $inputSettings);
        
        // Cleanup existing JSON preferences to prevent duplication
        if (isset($updated['privacy'])) {
            foreach ($columns as $col) {
                unset($updated['privacy'][$col]);
            }
        }
        unset($updated['profile_privacy']);

        $updateData = ['preferences' => $updated];
        if (!empty($directColumns)) {
            $updateData = array_merge($updateData, $directColumns);
        }

        $setting->update($updateData);

        $responseData = $updated;
        foreach ($columns as $col) {
            $responseData[$col] = $setting->$col ?? (
                $col === 'profile_visibility' ? 'verifiers_only' :
                ($col === 'allow_verifier_search' ? true :
                ($col === 'show_email_to_verifiers' ? false : true))
            );
        }

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'settings_updated',
            'entity_type' => UserSetting::class,
            'entity_id' => $setting->id,
            'description' => 'User settings updated.',
            'metadata' => [
                'changed_keys' => array_keys($request->input('settings')),
            ],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully.',
            'settings' => $responseData,
        ]);
    }

    /**
     * Reset all settings to role defaults.
     */
    public function reset(Request $request)
    {
        $user = $request->user();
        $defaults = UserSetting::getDefaults($user->role);

        UserSetting::updateOrCreate(
            ['user_id' => $user->id],
            ['preferences' => $defaults]
        );

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'settings_reset',
            'entity_type' => UserSetting::class,
            'entity_id' => $user->id,
            'description' => 'User settings reset to defaults.',
            'metadata' => [],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Settings have been reset to defaults.',
            'settings' => $defaults,
        ]);
    }
}
