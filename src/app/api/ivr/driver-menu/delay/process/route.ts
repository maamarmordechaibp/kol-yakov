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

        // Check if an MP3 exists for this specific amount of minutes
        const { data: promptFiles } = await supabase.storage.from('prompts').list();
        const existingPrompts = promptFiles ? promptFiles.map(f => f.name) : [];
        const targetFileName = `min-${delayMinutes}.mp3`;

        let minutesAudioXML = '';
        if (existingPrompts.includes(targetFileName)) {
            minutesAudioXML = playOrSay(targetFileName, 'מינוט');
        } else {
            minutesAudioXML = `<Say voice="man">${delayMinutes} minutes</Say>`;
        }

        // FIRE ROBOCALLS
        const { data: passengers } = await supabase.from('bookings').select('riders(phone)').eq('daily_ride_id', rideId).eq('status', 'active');
        if (passengers) {
            const outboundCalls = [];
            for (const p of passengers) {
                const targetPhone = (p.riders as any)?.phone;
                if (targetPhone) {
                    outboundCalls.push(triggerOutboundCall(targetPhone, `/api/ivr/outbound/driver-delayed?mins=${delayMinutes}`));
                }
            }
            await Promise.all(outboundCalls);
        }

        const xml = `
           ${playOrSay('delay-success.mp3', 'איר האט סוקסעספול פארשפעטיגט אויף נאך ')}
           ${minutesAudioXML}
           <Hangup/>
        `;
        return generateVoiceXML(xml);

    } catch (error) {
        console.error(error);
        return generateVoiceXML('<Hangup/>');
    }
}
