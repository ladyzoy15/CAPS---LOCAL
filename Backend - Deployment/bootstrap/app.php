<?php

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Middleware\HandleCors;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )

    ->withMiddleware(function (Middleware $middleware) {

        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        /*
         * Never redirect API/frontend requests
         * to a Laravel login route.
         */
        $middleware->redirectGuestsTo(function (Request $request) {
            return null;
        });

        /*
         * Enable CORS.
         */
        $middleware->api(prepend: [
            HandleCors::class,
        ]);
    })

    ->withExceptions(function (Exceptions $exceptions) {

        /*
         * Return JSON instead of an HTML login redirect
         * for unauthenticated requests.
         */
        $exceptions->render(function (
            \Illuminate\Auth\AuthenticationException $e,
            Request $request
        ) {
            if (
                $request->expectsJson() ||
                $request->is('api/*') ||
                $request->is('user/*') ||
                $request->is('subjects/*') ||
                $request->is('database-import/*')
            ) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                ], 401);
            }
        });

        /*
         * Force API/frontend errors to JSON.
         */
        $exceptions->shouldRenderJsonWhen(function (
            Request $request,
            \Throwable $e
        ) {
            return $request->expectsJson()
                || $request->is('api/*')
                || $request->is('user/*')
                || $request->is('subjects/*')
                || $request->is('database-import/*');
        });
    })

    ->create();