import { NextResponse } from 'next/server';
import { generateVoiceXML, playOrSay } from '@/lib/ivr-helper';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const formData = await req.formData().catch(() => new URLSearchParams());
        const digits = formData.get('Digits')?.toString() || '';

        const url = new URL(req.url);
        const riderId = url.searchParams.get('riderId');
        const dir = url.searchParams.get('dir');

        if (!riderId || !dir) return generateVoiceXML('<Hangup/>');

        let seder = '';
        if (digits === '1') seder = 'fartuk_seder';
        else if (digits === '2') seder = 'shiur_iyun';
        else if (digits === '3') seder = 'shiur_pshut';
        else if (digits === '4') seder = 'nacht_seder';
        else return generateVoiceXML(`<Redirect method="POST">/api/ivr/rider-menu/seder?riderId=${riderId}</Redirect>`);

        const supabase = await createClient();
        const today = new Date().toISOString().split('T')[0];

        const { data: rides } = await supabase
            .from('daily_rides')
            .select('id, estimated_departure_time, delay_minutes, driver_id, drivers(car_capacity, rider_id, audio_type, tts_name)')
            .eq('ride_date', today)
            .eq('direction', dir)
            .eq('seder', seder)
            .eq('status', 'scheduled')
            .order('estimated_departure_time', { ascending: true }); // chronological

        if (!rides || rides.length === 0) {
            return generateVoiceXML(`
              ${playOrSay('no-cars-this-seder.mp3', 'עס זענען נישטא קיין קארס יעצט פאר דעם סדר.')}
              <Redirect method="POST">/api/ivr/rider-menu/seder?riderId=${riderId}</Redirect>
            `);
        }

        // Filter capacity
        let availableRides = [];
        for (const ride of rides) {
            const { count } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('daily_ride_id', ride.id)
                .eq('status', 'active');

            const activeBookings = count || 0;
            const carCapacity = (ride.drivers as any)?.car_capacity || 4;

            if (activeBookings < carCapacity) {
                availableRides.push(ride);
            }
        }

        if (availableRides.length === 0) {
            return generateVoiceXML(`
              ${playOrSay('seder-cars-full.mp3', 'אלע קארס פאר דעם סדר זענען שוין פול.')}
              <Redirect method="POST">/api/ivr/rider-menu/seder?riderId=${riderId}</Redirect>
            `);
        }

        const rideIds = availableRides.map(r => r.id).join(',');
        let gatherXml = `<Gather action="/api/ivr/rider-menu/process?rides=${rideIds}" method="POST" numDigits="1" timeout="7">`;

        // Pre-fetch prompts bucket to see which time files actually exist!
        const { data: promptFiles } = await supabase.storage.from('prompts').list();
        const existingPrompts = promptFiles ? promptFiles.map(f => f.name) : [];

        gatherXml += playOrSay('rider-menu-intro.mp3', 'דאס זענען די עוועילעבל קארס:');

        availableRides.forEach((ride, index) => {
            const pressNumber = index + 1; // 1, 2, 3...
            const driverInfo = ride.drivers as any;

            let driverAudioXML = '';
            if (driverInfo?.audio_type === 'tts') {
                driverAudioXML = `<Say voice="man">${driverInfo.tts_name || 'Driver'}</Say>`;
            } else {
                driverAudioXML = playOrSay(`r-${ride.driver_id}.mp3`, 'דעם דרייווער');
            }

            const totalDelay = ride.delay_minutes || 0;
            const [hours, minutes] = ride.estimated_departure_time.split(':');
            let d = new Date();
            d.setHours(parseInt(hours), parseInt(minutes) + totalDelay, 0, 0);

            const fileHH = d.getHours().toString().padStart(2, '0');
            const fileMM = d.getMinutes().toString().padStart(2, '0');
            const targetFileName = `time-${fileHH}${fileMM}.mp3`;

            let timeAudioXML = '';
            if (existingPrompts.includes(targetFileName)) {
                timeAudioXML = playOrSay(targetFileName, 'די צייט');
            } else {
                const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
                let hr12 = d.getHours() % 12;
                if (hr12 === 0) hr12 = 12;
                timeAudioXML = `<Say voice="man">${hr12} ${fileMM} ${ampm}</Say>`;
            }

            gatherXml += `
        ${playOrSay('to-travel-with.mp3', 'צו פארן מיט')}
        ${driverAudioXML}
        ${playOrSay('leaving-at.mp3', 'וואס פארט ארויס אום')}
        ${timeAudioXML}
        ${playOrSay('press.mp3', 'דרוקט')}
        ${playOrSay(`${pressNumber}.mp3`, String(pressNumber))}
      `;
        });

        gatherXml += `</Gather>`;
        return generateVoiceXML(gatherXml);

    } catch (error) {
        console.error(error);
        return generateVoiceXML('<Hangup/>');
    }
}
