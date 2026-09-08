<?php

namespace Modules\Questions\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;

class FixSeededQuestionsSeeder extends Seeder
{
    public function run(): void
    {
        $fixed = 0;
        $skipped = 0;

        $choices = DB::table('choices')->get();

        foreach ($choices as $choice) {
            $decrypted = @Crypt::decryptString($choice->choiceText);

            if ($decrypted === false) {
                $skipped++;
                continue;
            }

            $original = $decrypted;

            $decrypted = preg_replace('/\s*\(Option\s*\d+\)\s*/', '', $decrypted);
            $decrypted = trim($decrypted);

            if ($decrypted !== $original) {
                DB::table('choices')
                    ->where('choiceID', $choice->choiceID)
                    ->update([
                        'choiceText' => Crypt::encryptString($decrypted),
                        'updated_at' => now(),
                    ]);

                $fixed++;
            }
        }

        echo "Fixed {$fixed} choices. Skipped {$skipped} choices.\n";
    }
}
