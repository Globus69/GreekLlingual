#!/usr/bin/env node

/**
 * Erstellt 5 Test-User mit 4-stelligem PIN direkt in Supabase
 *
 * Benötigt .env.local mit:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Helper: Generiert 4-stellige PIN
 */
function generatePin() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Erstellt einen Test-User mit PIN
 */
async function createPinUser(username, pin) {
    try {
        // 1. User in auth.users erstellen (mit fake Email)
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: `${username}@test.local`,
            password: pin,
            email_confirm: true,
            user_metadata: {
                username,
                pin,
                is_test_user: true
            }
        });

        if (authError) throw authError;
        if (!authData?.user) throw new Error('No user returned from auth.admin.createUser');

        console.log(`✅ User ${username} created (ID: ${authData.user.id})`);

        // 2. Profil in public.profiles erstellen
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: authData.user.id,
                username,
                pin,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

        if (profileError) throw profileError;

        console.log(`   Profile created for ${username}`);
        return { username, pin, userId: authData.user.id };

    } catch (error) {
        console.error(`❌ Error creating user ${username}:`, error);
        throw error;
    }
}

/**
 * Main: Erstellt 5 Test-User
 */
async function main() {
    console.log('🚀 Creating 5 test users with PIN authentication...\n');

    const users = [];

    for (let i = 1; i <= 5; i++) {
        const username = `testuser${i}`;
        const pin = generatePin();

        try {
            const result = await createPinUser(username, pin);
            users.push(result);
        } catch (error) {
            console.error(`Failed to create ${username}`);
        }
    }

    console.log('\n📋 Summary:');
    console.log('═══════════════════════════════════════');
    users.forEach(u => {
        console.log(`Username: ${u.username.padEnd(12)} | PIN: ${u.pin} | ID: ${u.userId}`);
    });
    console.log('═══════════════════════════════════════');
    console.log(`\n✅ Created ${users.length}/5 users successfully`);
}

main().catch(console.error);
