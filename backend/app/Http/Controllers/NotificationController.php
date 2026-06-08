<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationController extends Controller
{

    public function index(Request $request)
    {
        $user = $request->user();

        $notifications = $user->notifications()
            ->orderByDesc('created_at')
            ->take(15)
            ->get();

        return response()->json([
            'success'       => true,
            'notifications' => $this->formatNotifications($notifications)
        ]);
    }



    public function all(Request $request)
    {
        $user = $request->user();
        
        $query = $user->notifications();


        if ($request->has('filter')) {
            if ($request->filter === 'unread') {
                $query->whereNull('read_at');
            } elseif ($request->filter === 'read') {
                $query->whereNotNull('read_at');
            }
        }

        $notifications = $query->paginate(20);

        return response()->json([
            'success' => true,
            'notifications' => $this->formatNotifications($notifications->items()),
            'pagination' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ]
        ]);
    }


    public function markAsRead(Request $request, $id)
    {
        $notification = $request->user()->notifications()->find($id);
        
        if ($notification) {
            $notification->markAsRead();
        }

        return response()->json([
            'success' => true,
        ]);
    }


    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json([
            'success' => true,
        ]);
    }


    public function unreadCount(Request $request)
    {
        return response()->json([
            'success' => true,
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }


    private function formatNotifications($notifications)
    {
        return collect($notifications)->map(function ($notification) {
            return [
                'id' => $notification->id,
                'type' => $notification->data['type'] ?? 'INFO',
                'title' => $notification->data['title'] ?? 'Notification',
                'message' => $notification->data['message'] ?? '',
                'action_url' => $notification->data['action_url'] ?? null,
                'read_at' => $notification->read_at,
                'is_read' => !is_null($notification->read_at),
                'created_at' => $notification->created_at,
                'created_at_human' => $notification->created_at->diffForHumans(),
            ];
        });
    }
}
