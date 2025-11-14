import { NextResponse } from 'next/server';
import { getProductById } from '@/lib/openfoodfacts';
import { productIdSchema } from '@/lib/validators';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Validate product ID
    const validation = productIdSchema.safeParse({ id });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid product ID', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Fetch product details
    const product = await getProductById(validation.data.id);

    return NextResponse.json({ product }, { status: 200 });
  } catch (error) {
    console.error('Product API error:', error);
    
    if (error.message === 'Product not found') {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch product', message: error.message },
      { status: 500 }
    );
  }
}

