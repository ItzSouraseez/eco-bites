import { NextResponse } from 'next/server';
import { searchProducts } from '@/lib/openfoodfacts';
import { searchQuerySchema } from '@/lib/validators';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    // Validate query
    const validation = searchQuerySchema.safeParse({ query });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameter', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Search products
    const products = await searchProducts(validation.data.query);

    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search products', message: error.message },
      { status: 500 }
    );
  }
}

