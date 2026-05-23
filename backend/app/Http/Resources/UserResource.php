<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'role' => $this->role,
            'name' => match ($this->role) {
                'student' => $this->student ? trim(collect([
                    $this->student->first_name,
                    $this->student->middle_name,
                    $this->student->last_name,
                ])->filter()->implode(' ')) : null,
                'university' => $this->institution?->name,
                'verifier' => $this->verifier?->company_name,
                default => null,
            },
            'is_approved' => $this->is_approved,
            'email_verified_at' => $this->email_verified_at,
            'student' => $this->whenLoaded('student'),
            'institution' => $this->whenLoaded('institution'),
            'verifier' => $this->whenLoaded('verifier'),
            'certificates_count' => $this->relationLoaded('student') && $this->student ? $this->student->certificates()->count() : null,
        ];
    }
}
