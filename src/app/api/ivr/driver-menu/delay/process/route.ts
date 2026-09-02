import { NextResponse } from 'next/server';
import { generateVoiceXML, playOrSay, triggerOutboundCall } from '@/lib/ivr-helper';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const formData = await req.formData().catch(() => new URLSearchParams());
        const rideId = new URL(req.url).searchParams.get('rideId');

        let digits = formData.get('Digits')?.toString().replace(/\D/g, '') || '';
        if (!digits || !rideId) return generateVoiceXML('<Hangup/>');

        const delayMinutes = parseInt(digits);
        if (isNaN(delayMinutes) || delayMinutes <= 0) {
            return generateVoiceXML(`<Hangup/>`);
        }

        const supabase = await createClient();

        // 1. Fetch current ride estimated time
        const { data: ride } = await supabase.from('daily_rides').select('estimated_departure_time, delay_minutes').eq('id', rideId).single();
        if (!ride) return generateVoiceXML('<Hangup/>');

        // 2. Add the delay
        const totalDelay = (ride.delay_minutes || 0) + delayMinutes;

        // We technically keep original estimated_departure_time static, 
        // and just update delay_minutes. The frontend/IVR can calculate real departure!
        await supabase.from('daily_rides').update({ delay_minutes: totalDelay }).eq('id', rideId);

        // Calculate the new time for the user audio:
        const [hoursStr, minutesStr] = ride.estimated_departure_time.split(':');
        let d = new Date();
        d.setHours(parseInt(hoursStr), parseInt(minutesStr) + totalDelay, 0, 0);

        // Format it
        const newHHString = d.getHours().toString().padStart(2, '0');
        const newMMString = d.getMinutes().toString().padStart(2, '0');

        // FIRE ROBOCALLS
        const { data: passengers } = await supabase.from('bookings').select('riders(phone)').eq('daily_ride_id', rideId).eq('status', 'active');
        if (passengers) {
            for (const p of passengers) {
                const targetPhone = (p.riders as any)?.phone;
                if (targetPhone) {
                    triggerOutboundCall(targetPhone, `/api/ivr/outbound/driver-delayed?hh=${newHHString}&mm=${newMMString}`);
                }
            }
        }

        const xml = `
           ${playOrSay('delay-success.mp3', 'איר האט סוקסעספול געשפעטיגט עיער ארויספאר צייט צו ')}
           <Say voice="man">${newHHString}:${newMMString}</Say>
           <Hangup/>
        `;
        return generateVoiceXML(xml);

    } catch (error) {
        console.error(error);
        return generateVoiceXML('<Hangup/>');
    }
}
