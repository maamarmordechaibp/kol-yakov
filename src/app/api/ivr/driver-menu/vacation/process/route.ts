export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { generateVoiceXML, playOrSay } from '@/lib/ivr-helper';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const formData = await req.formData().catch(() => new URLSearchParams());
        const driverId = new URL(req.url).searchParams.get('driverId');
        // Clean the digits to remove any trailing '#' symbol if they pressed pound
        const digits = formData.get('Digits')?.toString().replace(/\D/g, '') || '';

        if (!digits || !driverId) return generateVoiceXML('<Hangup/>');

        const days = parseInt(digits);
        if (days === 0 || isNaN(days)) {
            return generateVoiceXML(`<Redirect method="POST">/api/ivr/driver-menu/vacation?driverId=${driverId}</Redirect>`);
        }

        const supabase = await createClient();

        // Calculate future date natively in JS
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        const absentUntilStr = futureDate.toISOString().split('T')[0];

        // Update the driver's absent column
        await supabase.from('drivers').update({ absent_until: absentUntilStr }).eq('id', driverId);

        // Cancel today's ride immediately if there is one
        const today = new Date().toISOString().split('T')[0];
        const { data: todayRide } = await supabase.from('daily_rides').select('id').eq('driver_id', driverId).eq('ride_date', today).single();
        if (todayRide) {
            await supabase.from('daily_rides').update({ status: 'cancelled' }).eq('id', todayRide.id);
            await supabase.from('bookings').update({ status: 'pending', daily_ride_id: null }).eq('daily_ride_id', todayRide.id);
        }

        const xml = `
           ${playOrSay('vacation-success.wav', 'א דאנק. די סיסטעם האט סוקסעספול פארשריבן אייער וואקאציע. א גוטן טאג.')}
           <Hangup/>
        `;
        return generateVoiceXML(xml);

    } catch (error) {
        console.error(error);
        return generateVoiceXML('<Hangup/>');
    }
}

