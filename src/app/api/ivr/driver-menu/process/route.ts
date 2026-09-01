export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { generateVoiceXML, playOrSay } from '@/lib/ivr-helper';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const formData = await req.formData().catch(() => new URLSearchParams());
        const digits = formData.get('Digits')?.toString() || '';
        const url = new URL(req.url);
        const rideId = url.searchParams.get('rideId');
        const riderId = url.searchParams.get('riderId');

        const supabase = await createClient();

        // Ensure we explicitly fetch the driver ID associated with this caller
        const { data: driver } = await supabase.from('drivers').select('id').eq('rider_id', riderId).single();
        if (!driver) return generateVoiceXML('<Hangup/>');

        if (digits === '3') {
            // Redirect to Vacation Setup Menu
            return generateVoiceXML(`<Redirect method="POST">/api/ivr/driver-menu/vacation?driverId=${driver.id}</Redirect>`);
        }

        if (rideId && rideId !== 'none') {
            if (digits === '1') {
                // Driver departs!
                await supabase.from('daily_rides').update({ status: 'departed' }).eq('id', rideId);
                return generateVoiceXML(`
                   ${playOrSay('driver-departed-success.mp3', 'א גרויסן יישר כח, אלע פאסאזשירן באקומען יעצט א קאל צו אראפקומען.')}
                   <Hangup/>
                `);
            }
            if (digits === '2') {
                // Driver cancels car completely
                await supabase.from('daily_rides').update({ status: 'cancelled' }).eq('id', rideId);
                // Reset associated bookings to pending
                await supabase.from('bookings').update({ status: 'pending', daily_ride_id: null }).eq('daily_ride_id', rideId);
                return generateVoiceXML(`
                   ${playOrSay('driver-cancel-success.mp3', 'דער קאר איז סוקסעספול אפגעזאגט געווארן. אלע פאסאזשירן וועלן אריבערגיין צום נעקסטן קאר.')}
                   <Hangup/>
                `);
            }
        }

        // Invalid response, loop back
        return generateVoiceXML(`<Redirect method="POST">/api/ivr/driver-menu?riderId=${riderId}</Redirect>`);

    } catch (error) {
        console.error(error);
        return generateVoiceXML('<Hangup/>');
    }
}
