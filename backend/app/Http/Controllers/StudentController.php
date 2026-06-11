<?php

namespace App\Http\Controllers;

use App\Models\Student;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function search(Request $request)
    {
        $query = Student::with('user');

        // Search by NID (hashed), name, or email
        $query->when($request->search, function ($q, $search) {
            $nidHash = hash('sha256', trim($search));
            $q->where(function ($subQ) use ($search, $nidHash) {
                $subQ->where('nid_hash', $nidHash)
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQ) use ($search) {
                        $userQ->where('email', 'like', "%{$search}%");
                    });
            });
        });

        $results = $query->paginate($request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'results' => $results,
        ]);
    }
}
