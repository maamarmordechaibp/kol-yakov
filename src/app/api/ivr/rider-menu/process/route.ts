import { NextResponse } from 'next/server';
import { generateVoiceXML, playOrSay } from '@/lib/ivr-helper';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const url = new URL(req.url);
        const rideIdsStr = url.searchParams.get('rides') || '';
        const rideIds = rideIdsStr.split(',');

        const formData = await req.formData().catch(() => new URLSearchParams());
        const fromNumber = formData.get('From')?.toString() || '';
        const digits = formData.get('Digits')?.toString() || '';

        // Convert digit to array index (e.g., pressed 1 -> index 0)
        const index = parseInt(digits) - 1;
        const selectedRideId = rideIds[index];

        if (!selectedRideId) {
            return generateVoiceXML('<Say language="he">איר האט געדרוקט אן אומריכטיגע נומער.</Say><Hangup/>');
        }

        const supabase = await createClient();

        // 1. Get the bochur rider ID
        const { data: rider } = await supabase
            .from('riders')
            .select('id')
            .eq('phone', fromNumber)
            .single();

        if (!rider) {
            return generateVoiceXML('<Say>Error.</Say><Hangup/>');
        }

        // 2. Double check capacity just in case someone booked it while they were listening
        const { data: ride } = await supabase
            .from('daily_rides')
            .select('id, drivers(car_capacity)')
            .eq('id', selectedRideId)
            .single();

        const { count } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('daily_ride_id', selectedRideId)
            .eq('status', 'active');

        const carCapacity = (ride?.drivers as any)?.car_capacity || 4;
        const activeBookings = count || 0;

        if (activeBookings >= carCapacity) {
            return generateVoiceXML(`
        ${playOrSay('no-seats.mp3', 'אלע קארס זענען ליידער שוין פול פאר היינט. א גוטן טאג.')}
        <Hangup/>
      `);
        }

        // 3. Create the booking!
        await supabase.from('bookings').insert({
            daily_ride_id: selectedRideId,
            rider_id: rider.id,
            is_preset: false,
            is_paid: false,
            status: 'active'
        } as any);

        // 4. Confirm booking
        return generateVoiceXML(`
      ${playOrSay('booking-confirmed.mp3', 'דער זיץ איז באשטעלט. א גוטן טאג.')}
      <Hangup/>
    `);

    } catch (error) {
        console.error('Rider Menu Process Error:', error);
        return generateVoiceXML('<Say>Error.</Say><Hangup/>');
    }
}
