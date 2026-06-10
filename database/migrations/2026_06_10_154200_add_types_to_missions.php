<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE missions MODIFY COLUMN type ENUM('audit','automation','transformation','formation','integration','conseil','deploiement') NOT NULL DEFAULT 'transformation'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE missions MODIFY COLUMN type ENUM('audit','automation','transformation','formation','integration') NOT NULL DEFAULT 'transformation'");
    }
};
