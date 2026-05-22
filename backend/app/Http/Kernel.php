<?php

namespace App\Http;

use Illuminate\Foundation\Http\Kernel as HttpKernel;

class Kernel extends HttpKernel
{
    protected $middleware = [
        \Illuminate\Http\Middleware\HandleCors::class,
    ];

    protected $middlewareGroups = [
        'web' => [
            //
        ],

        'api' => [
            \Illuminate\Http\Middleware\HandleCors::class,
        ],
    ];

    protected $middlewareAliases = [
        'auth' => \Illuminate\Auth\Middleware\Authenticate::class,
        'role' => \App\Http\Middleware\CheckRole::class,
    ];
}
