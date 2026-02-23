
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findUserByPin(pin: string) {
    try {
        // Log all users to see the structure
        const { data: users, error } = await supabase
            .from('users')
            .select('*');

        if (error) throw error;

        const user = users?.find(u => u.pin === pin || u.auth_pin === pin);

        if (user) {
            console.log('USER_FOUND:' + JSON.stringify(user));
        } else {
            console.log('USER_NOT_FOUND');
            // Log users to help debug
            console.log('Available users:', users?.map(u => ({ id: u.id, name: u.name, pin: u.pin, auth_pin: u.auth_pin })));
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

findUserByPin('2098');
