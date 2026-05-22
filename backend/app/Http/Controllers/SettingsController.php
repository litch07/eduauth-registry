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

        if ($merged !== ($setting->preferences ?? [])) {
            $setting->update(['preferences' => $merged]);
        }

        return response()->json([
            'success' => true,
            'settings' => $merged,
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

        $setting = UserSetting::firstOrCreate(
            ['user_id' => $user->id],
            ['preferences' => UserSetting::getDefaults($user->role)]
        );

        $current = $setting->preferences ?? UserSetting::getDefaults($user->role);
        $updated = UserSetting::deepMerge($current, $request->input('settings'));

        $setting->update(['preferences' => $updated]);

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
            'settings' => $updated,
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
