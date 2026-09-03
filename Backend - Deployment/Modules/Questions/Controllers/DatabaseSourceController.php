<?php

namespace Modules\Questions\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Modules\Questions\Models\DatabaseSource;
use Throwable;

class DatabaseSourceController
{
    /**
     * GET /api/database-sources
     *
     * Get all active database sources.
     */
    public function index()
    {
        $sources = DatabaseSource::where('is_active', true)
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'driver',
                'host',
                'port',
                'database',
                'username',
                'is_active',
                'created_at',
                'updated_at',
            ]);

        return response()->json([
            'success' => true,
            'data' => $sources,
        ]);
    }

    /**
     * POST /api/database-sources
     *
     * Add a new database source.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:100',
                'unique:database_sources,name',
            ],

            'driver' => [
                'nullable',
                'string',
                'in:mysql',
            ],

            'host' => [
                'required',
                'string',
                'max:255',
            ],

            'port' => [
                'required',
                'integer',
                'between:1,65535',
            ],

            'database' => [
                'required',
                'string',
                'max:100',
            ],

            'username' => [
                'required',
                'string',
                'max:100',
            ],

            'password' => [
                'nullable',
                'string',
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Please check the database information.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $connectionName = 'database_source_test_' . uniqid();

        try {

            /*
             * Build temporary connection.
             */
            Config::set(
                "database.connections.{$connectionName}",
                [
                    'driver' => $request->input('driver', 'mysql'),
                    'host' => $request->input('host'),
                    'port' => $request->input('port', 3306),
                    'database' => $request->input('database'),
                    'username' => $request->input('username'),
                    'password' => $request->input('password', ''),

                    'charset' => 'utf8mb4',
                    'collation' => 'utf8mb4_unicode_ci',
                    'prefix' => '',
                    'prefix_indexes' => true,
                    'strict' => true,
                    'engine' => null,

                    'options' => extension_loaded('pdo_mysql')
                        ? array_filter([
                            \PDO::ATTR_EMULATE_PREPARES => true,
                        ])
                        : [],
                ]
            );

            DB::purge($connectionName);

            /*
             * Test connection.
             */
            DB::connection($connectionName)->getPdo();

            /*
             * Save database information.
             *
             * Password is encrypted.
             */
            $source = DatabaseSource::create([
                'name' => $request->input('name'),

                'driver' => $request->input(
                    'driver',
                    'mysql'
                ),

                'host' => $request->input('host'),

                'port' => $request->input(
                    'port',
                    3306
                ),

                'database' => $request->input(
                    'database'
                ),

                'username' => $request->input(
                    'username'
                ),

                'password' => Crypt::encryptString(
                    $request->input(
                        'password',
                        ''
                    )
                ),

                'is_active' => true,
            ]);

            DB::purge($connectionName);

            return response()->json([
                'success' => true,

                'message' =>
                    'Database source added successfully.',

                'data' => [
                    'id' => $source->id,
                    'name' => $source->name,
                    'driver' => $source->driver,
                    'host' => $source->host,
                    'port' => $source->port,
                    'database' => $source->database,
                    'username' => $source->username,
                    'is_active' => $source->is_active,
                ],
            ], 201);

        } catch (Throwable $e) {

            DB::purge($connectionName);

            return response()->json([
                'success' => false,

                'message' =>
                    'Could not connect to the database.',

                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * POST /api/database-sources/{id}/test
     *
     * Test an existing database source.
     */
    public function testConnection($id)
    {
        $source = DatabaseSource::find($id);

        if (!$source) {
            return response()->json([
                'success' => false,
                'message' => 'Database source not found.',
            ], 404);
        }

        $connectionName =
            'database_source_test_' . $source->id;

        try {

            $password = '';

            if (!empty($source->password)) {

                try {

                    $password =
                        Crypt::decryptString(
                            $source->password
                        );

                } catch (Throwable $e) {

                    /*
                     * Fallback for old/plain passwords.
                     */
                    $password =
                        $source->password;
                }
            }

            Config::set(
                "database.connections.{$connectionName}",
                [
                    'driver' => $source->driver,

                    'host' => $source->host,

                    'port' => $source->port,

                    'database' => $source->database,

                    'username' => $source->username,

                    'password' => $password,

                    'charset' => 'utf8mb4',

                    'collation' =>
                        'utf8mb4_unicode_ci',

                    'prefix' => '',

                    'prefix_indexes' => true,

                    'strict' => true,

                    'engine' => null,
                ]
            );

            DB::purge($connectionName);

            DB::connection(
                $connectionName
            )->getPdo();

            DB::purge($connectionName);

            return response()->json([
                'success' => true,

                'message' =>
                    "Connection to {$source->name} was successful.",
            ]);

        } catch (Throwable $e) {

            DB::purge($connectionName);

            return response()->json([
                'success' => false,

                'message' =>
                    "Connection to {$source->name} failed.",

                'error' =>
                    $e->getMessage(),
            ], 422);
        }
    }

    /**
     * DELETE /api/database-sources/{id}
     *
     * Disable a database source.
     */
    public function destroy($id)
    {
        $source =
            DatabaseSource::find($id);

        if (!$source) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Database source not found.',
            ], 404);
        }

        /*
         * Soft-disable instead of permanently deleting.
         */
        $source->update([
            'is_active' => false,
        ]);

        return response()->json([
            'success' => true,

            'message' =>
                'Database source disabled successfully.',
        ]);
    }
}