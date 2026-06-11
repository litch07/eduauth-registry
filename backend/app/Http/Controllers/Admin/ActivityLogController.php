<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ActivityLog::with('user')->latest();

        // Time Filter
        $filter = $request->query('filter', 'all');
        if ($filter === 'today') {
            $query->whereDate('created_at', Carbon::today());
        } elseif ($filter === 'this_week') {
            $query->whereBetween('created_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]);
        } elseif ($filter === 'this_month') {
            $query->whereMonth('created_at', Carbon::now()->month)->whereYear('created_at', Carbon::now()->year);
        }

        // Type Filter
        $type = $request->query('type', 'all');
        if ($type !== 'all') {
            if ($type === 'user_action') {
                $query->whereIn('action', ['login', 'logout', 'profile_update', 'password_change', 'register', 'verification']);
            } elseif ($type === 'certificate') {
                $query->where('entity_type', 'certificate')
                      ->orWhere('entity_type', 'App\Models\Certificate');
            } elseif ($type === 'enrollment') {
                $query->where('entity_type', 'enrollment')
                      ->orWhere('entity_type', 'App\Models\Enrollment');
            } elseif ($type === 'system') {
                $query->where('entity_type', 'system');
            }
        }

        $logs = $query->paginate(20);

        $formattedLogs = $logs->getCollection()->map(function ($log) {
            $target = $log->metadata['target'] ?? null;
            if (!$target && $log->entity_type && $log->entity_id) {
                $typeBase = class_basename($log->entity_type);
                $target = $typeBase . ' #' . $log->entity_id;
            }
            
            return [
                'id' => $log->id,
                'user_name' => $log->user ? $log->user->name : 'System',
                'user_role' => $log->user ? $log->user->role : 'system',
                'action_description' => $log->description ?: $log->action,
                'target' => $target,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at->format('d/m/Y H:i'),
            ];
        });

        $logs->setCollection($formattedLogs);

        return response()->json(['success' => true, 'logs' => $logs]);
    }
}
