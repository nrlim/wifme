import { NextResponse } from 'next/server';
import { internalProcessPayment } from '@/actions/finance';
import { createHash } from 'crypto';

export async function POST(req: Request) {
  try {
    // Basic Content-Type guard
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ success: false }, { status: 415 });
    }

    const body = await req.json();
    const { order_id, transaction_status, status_code, gross_amount, signature_key } = body;

    if (!order_id || !transaction_status) {
      return NextResponse.json({ success: false, message: 'Bad request' }, { status: 400 });
    }

    // Security Check: if MIDTRANS_SERVER_KEY is configured, signature is REQUIRED
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (serverKey) {
      if (!signature_key) {
        return NextResponse.json({ success: false, message: 'Signature missing' }, { status: 403 });
      }
      // SHA512(order_id + status_code + gross_amount + serverKey)
      const expectedSignature = createHash('sha512')
        .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
        .digest('hex');

      if (expectedSignature !== signature_key) {
        return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 403 });
      }
    }

    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      const targetBookingId = order_id.startsWith('BOOKING-') 
        ? order_id.replace('BOOKING-', '') 
        : order_id;
      
      try {
        await internalProcessPayment(targetBookingId);
      } catch (err: any) {
        if (err.message !== 'Already paid') throw err;
      }
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });

  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
