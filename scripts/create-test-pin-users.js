#!/usr/bin/env node

/**
 * Erstellt 5 Test-User mit 4-stelligem PIN direkt in Supabase
 *
 * Benötigt .env.local mit:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const testUsers = [
    { name: 'Anna Meier', pin_4digit: '3741', level: 'A1', difficulty: 'easy', preply: 'anna_m', outside_preply: '-', fee_per_hour: 28.50, currency: 'Euro' },
    { name: 'Lukas Braun', pin_4digit: '8192', level: 'A1', difficulty: 'easy', preply: 'lukas_b', outside_preply: 'braun_outside', fee_per_hour: 32.00, currency: 'Euro' },
    { name: 'Sofia Müller', pin_4digit: '5624', level: 'A1', difficulty: 'easy', preply: 'sofia_m', outside_preply: '-', fee_per_hour: 25.00, currency: 'Dollar' },
    { name: 'Dimitris Papadopoulos', pin_4digit: '7358', level: 'A1', difficulty: 'easy', preply: 'dimitris_p', outside_preply: 'papadopoulos_ext', fee_per_hour: 30.00, currency: 'Euro' },
    { name: 'Elena Schmidt', pin_4digit: '9103', level: 'A1', difficulty: 'easy', preply: 'elena_s', outside_preply: '-', fee_per_hour: 27.50, currency: 'Dollar' },
];

async function createUsers() {
    console.log('🔄 Erstelle Test-User mit 4-stelligem PIN...\n');

    for (const user of testUsers) {
        const userData = {
            ...user,
            role: 'student',
            performance_index: `${user.level}-${user.difficulty}`,
        };

        const { data, error } = await supabase
            .from('users')
            .insert([userData])
            .select();

        if (error) {
            console.error(`❌ Fehler bei ${user.name}:`, error.message);
        } else {
            console.log(`✅ ${user.name} erstellt (PIN: ${user.pin_4digit})`);
        }
    }

    console.log('\n🎉 Fertig! Du kannst jetzt mit den PINs testen.');
}

createUsers().catch(console.error);
