import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { historyEntrySchema } from '@/lib/validators';

// GET - Fetch search history
export async function GET(request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase not configured', history: [] },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    let query = supabase
      .from('search_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ history: data || [] }, { status: 200 });
  } catch (error) {
    console.error('History GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history', message: error.message },
      { status: 500 }
    );
  }
}

// POST - Save search to history
export async function POST(request) {
  try {
    if (!isSupabaseConfigured()) {
      // Silently fail if Supabase is not configured
      return NextResponse.json({ history: null }, { status: 201 });
    }

    const body = await request.json();

    // Validate request body
    const validation = historyEntrySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { query, productId, userId } = validation.data;

    // Get user from auth header if available
    const authHeader = request.headers.get('authorization');
    let authenticatedUserId = userId;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          authenticatedUserId = user.id;
        }
      } catch (err) {
        console.error('Error verifying auth token:', err);
      }
    }

    // Insert into database
    const { data, error } = await supabase
      .from('search_history')
      .insert({
        query,
        product_id: productId || null,
        user_id: authenticatedUserId || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ history: data }, { status: 201 });
  } catch (error) {
    console.error('History POST error:', error);
    // Don't fail the request if history save fails
    return NextResponse.json({ history: null }, { status: 201 });
  }
}

