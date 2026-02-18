/**
 * Server-Side Cloze Text List API
 *
 * Uses service_role key to bypass RLS for fetching cloze texts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
}

const supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
              autoRefreshToken: false,
              persistSession: false,
          },
      })
    : null;

// GET - Fetch filtered cloze texts list
export async function GET(request: NextRequest) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json(
                { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY not set' },
                { status: 500 }
            );
        }

        const { searchParams } = new URL(request.url);

        const search = searchParams.get('search') || '';
        const level = searchParams.get('level') || '';
        const difficulty = searchParams.get('difficulty') || '';
        const frequency_min = searchParams.get('frequency_min');
        const frequency_max = searchParams.get('frequency_max');
        const category = searchParams.get('category') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        let query = supabaseAdmin
            .from('cloze_texts')
            .select('*', { count: 'exact' });

        // Apply filters
        if (search && search.trim() !== '') {
            query = query.or(`greek_transcription.ilike.%${search}%,en_translation.ilike.%${search}%,de_translation.ilike.%${search}%,es_translation.ilike.%${search}%,ru_translation.ilike.%${search}%,cloze_answer.ilike.%${search}%`);
        }

        if (level && level !== 'All') {
            query = query.eq('level', level);
        }

        if (difficulty && difficulty !== 'All') {
            query = query.eq('difficulty', difficulty);
        }

        if (frequency_min) {
            query = query.gte('frequency', parseInt(frequency_min));
        }

        if (frequency_max) {
            query = query.lte('frequency', parseInt(frequency_max));
        }

        if (category && category.trim() !== '') {
            query = query.eq('category', category);
        }

        // Pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        query = query
            .order('created_at', { ascending: false })
            .range(from, to);

        const { data, error, count } = await query;

        if (error) {
            console.error('Fetch cloze texts error:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        const total = count ?? 0;

        return NextResponse.json({
            data: data || [],
            total,
            page,
            limit,
            hasMore: total > page * limit,
        });
    } catch (error) {
        console.error('GET API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Fetch failed' },
            { status: 500 }
        );
    }
}
