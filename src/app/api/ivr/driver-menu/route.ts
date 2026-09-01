export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { generateVoiceXML, playOrSay } from '@/lib/ivr-helper';
import { createClient } from '@/lib/supabase/server';



export async function POST(req: Request) {
    try {
        const formData = await req.formData().catch(() => new URLSearchParams());
        const fromNumber = formData.get('From')?.toString() || '';

        const supabase = await createClient();

        // Allow passing riderId directly for temporary registration sessions
        let riderId = new URL(req.url).searchParams.get('riderId');

        if (!riderId) {
            const last10 = fromNumber.replace(/\D/g, '').slice(-10);
            const { data: riders } = await supabase.from('riders').select('id').ilike('phone', `%${last10}`);
            if (!riders || riders.length === 0) return generateVoiceXML('<Hangup/>');
            riderId = riders[0].id;
        }

        const { data: driver } = await supabase.from('drivers').select('id').eq('rider_id', riderId).single();
        if (!driver) return generateVoiceXML('<Hangup/>');

        // 2. Find today's ride
        const today = new Date().toISOString().split('T')[0];
        const { data: ride } = await supabase
            .from('daily_rides')
            .select('id, status')
            .eq('driver_id', driver.id)
            .eq('ride_date', today)
            .single();

        if (!ride || ride.status === 'cancelled') {
            return generateVoiceXML(`
           <Gather action="/api/ivr/driver-menu/process?rideId=none&riderId=${riderId}" method="POST" numDigits="1" timeout="7">
               ${playOrSay('not-driving.mp3', 'איר זענט נישט מיועד צו דרייוון היינט.')}
               ${playOrSay('vacation-prompt-intro.mp3', 'צו רעפארטן אז איר פארט אוועק אויף וואקאציע, דרוקט דריי.')}
           </Gather>
           <Hangup/>
        `);
        }

        // 3. Count Passengers
        const { count } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('daily_ride_id', ride.id)
            .eq('status', 'active');

        const activeBookings = count || 0;

        // 4. Generate the Menu
        let xml = `
      ${playOrSay('you-have.mp3', 'איר האט יעצט')}
      ${playOrSay(`${activeBookings}.mp3`, String(activeBookings))}
      ${playOrSay('passengers.mp3', 'פאסאזשירן פאר היינט')}
      
      <Gather action="/api/ivr/driver-menu/process?rideId=${ride.id}&riderId=${riderId}" method="POST" numDigits="1" timeout="7">
         ${playOrSay('driver-menu.mp3', 'צו לאזן וויסן אז איר פארט יעצט ארויס ביטע דרוקט איינס. צו אפזאגן דעם קאר פאר היינט דרוקט צוויי. צו נעמען וואקאציע פאר אפאר טעג דרוקט דריי.')}
      </Gather>
      <Hangup/>
    `;

        return generateVoiceXML(xml);
    } catch (error) {
        console.error('Driver Menu Error:', error);
        return generateVoiceXML('<Say>Error.</Say><Hangup/>');
    }
}
