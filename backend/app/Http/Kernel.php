<?php

namespace App\Http;

use Illuminate\Foundation\Http\Kernel as HttpKernel;

class Kernel extends HttpKernel
{
    protected $middleware = [
        //
    ];

    protected $middlewareGroups = [
        'web' => [
            //
        ],

        'api' => [
            //
        ],
    ];

    protected $middlewareAliases = [
        'role' => \App\Http\Middleware\CheckRole::class,
    ];
}
