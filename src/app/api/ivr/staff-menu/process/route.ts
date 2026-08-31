import { NextResponse } from 'next/server';
import { generateVoiceXML, playOrSay } from '@/lib/ivr-helper';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const formData = await req.formData().catch(() => new URLSearchParams());
        const fromNumber = formData.get('From')?.toString() || '';
        const digits = formData.get('Digits')?.toString() || '';

        if (digits !== '1') {
            return generateVoiceXML('<Say language="he">א גוטן טאג.</Say><Hangup/>');
        }

        const supabase = await createClient();

        // 1. Get the staff rider ID
        const { data: rider } = await supabase
            .from('riders')
            .select('id')
            .eq('phone', fromNumber)
            .single();

        if (!rider) {
            return generateVoiceXML('<Say>Error.</Say><Hangup/>');
        }

        // 2. Find their active preset booking for TODAY
        // Usually daily_rides are generated early morning for today
        const today = new Date().toISOString().split('T')[0];

        const { data: activeBooking } = await supabase
            .from('bookings')
            .select('id, daily_ride_id')
            .eq('rider_id', rider.id)
            .eq('is_preset', true)
            .eq('status', 'active')
            .gte('booked_at', `${today}T00:00:00Z`)
            .single();

        if (!activeBooking) {
            // No active preset found for today
            return generateVoiceXML(`
        ${playOrSay('no-active-preset.mp3', 'איר האט נישט קיין באשטעלטע פלאץ פאר היינט. א גוטן טאג.')}
        <Hangup/>
      `);
        }

        // 3. Mark the booking as cancelled
        await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', activeBooking.id);

        // 4. Confirm cancellation
        return generateVoiceXML(`
      ${playOrSay('staff-cancel-confirmed.mp3', 'אייער זיץ איז אפגערופן געווארן פאר היינט. א גוטן טאג.')}
      <Hangup/>
    `);

    } catch (error) {
        console.error('Staff Process Error:', error);
        return generateVoiceXML('<Say>Error.</Say><Hangup/>');
    }
}
