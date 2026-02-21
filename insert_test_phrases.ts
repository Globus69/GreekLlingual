import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const phrases = [
    {
        greek_transcription: 'Καλημέρα, τι κάνετε;',
        en_translation: 'Good morning, how are you?',
        ru_translation: 'Доброе утро, как дела?',
        de_translation: 'Guten Morgen, wie geht es Ihnen?',
        level: 'A1',
        difficulty: 'easy',
        frequency: 5
    },
    {
        greek_transcription: 'Μία καφέ παρακαλώ.',
        en_translation: 'One coffee please.',
        ru_translation: 'Один кофе, пожалуйста.',
        de_translation: 'Einen Kaffee bitte.',
        level: 'A1',
        difficulty: 'easy',
        frequency: 4
    },
    {
        greek_transcription: 'Δεν μιλάω καλά ελληνικά.',
        en_translation: "I don't speak Greek well.",
        ru_translation: 'Я плохо говорю по-гречески.',
        de_translation: 'Ich spreche nicht gut Griechisch.',
        level: 'A1',
        difficulty: 'medium',
        frequency: 3
    }
];

async function insertPhrases() {
    const { data, error } = await supabase
        .from('daily_phrases')
        .insert(phrases)
        .select();

    if (error) {
        console.error('Error inserting phrases:', error);
        process.exit(1);
    }

    console.log('Successfully inserted phrases:', data.length);
}

insertPhrases();
