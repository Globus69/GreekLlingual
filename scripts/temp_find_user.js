
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic env parser
const env = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8')
    .split('\n')
    .reduce((acc, line) => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            acc[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1');
        }
        return acc;
    }, {});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findUserByPin(pin) {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*');

        if (error) throw error;

        const user = users?.find(u => String(u.pin) === String(pin) || String(u.auth_pin) === String(pin));

        if (user) {
            console.log('USER_FOUND:' + JSON.stringify(user));
        } else {
            console.log('USER_NOT_FOUND');
            console.log('Available users:', users?.map(u => ({ id: u.id, name: u.name, pin: u.pin, auth_pin: u.auth_pin })));
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

findUserByPin('2098');
