/**
 * Server-Side Cloze Text CRUD API
 *
 * Uses service_role key to bypass RLS for admin operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { CreateClozeTextPayload } from '@/types/cloze-text';

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

// POST - Create new cloze text
export async function POST(request: NextRequest) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json(
                { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY not set' },
                { status: 500 }
            );
        }

        const payload: CreateClozeTextPayload = await request.json();

        const { data, error } = await supabaseAdmin
            .from('cloze_texts')
            .insert([payload])
            .select()
            .single();

        if (error) {
            console.error('Create cloze text error:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('POST API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Create failed' },
            { status: 500 }
        );
    }
}

// PUT - Update cloze text
export async function PUT(request: NextRequest) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json(
                { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY not set' },
                { status: 500 }
            );
        }

        const { id, ...updates } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('cloze_texts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Update cloze text error:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('PUT API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Update failed' },
            { status: 500 }
        );
    }
}

// DELETE - Delete cloze text
export async function DELETE(request: NextRequest) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json(
                { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY not set' },
                { status: 500 }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('cloze_texts')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Delete cloze text error:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Delete failed' },
            { status: 500 }
        );
    }
}
