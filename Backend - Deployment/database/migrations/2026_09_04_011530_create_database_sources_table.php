<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('database_sources', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->string('driver', 30)->default('mysql');
            $table->string('host', 255);
            $table->unsignedInteger('port')->default(3306);
            $table->string('database', 100);
            $table->string('username', 100);
            $table->text('password')->nullable();
            $table->string('storage_url', 500)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('database_sources');
    }
};