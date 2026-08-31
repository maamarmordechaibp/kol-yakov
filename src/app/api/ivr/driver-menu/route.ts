import { NextResponse } from 'next/server';
import { generateVoiceXML, playOrSay } from '@/lib/ivr-helper';
import { createClient } from '@/lib/supabase/server';



export async function POST(req: Request) {
    try {
        const formData = await req.formData().catch(() => new URLSearchParams());
        const fromNumber = formData.get('From')?.toString() || '';

        const supabase = await createClient();

        // 1. Get Driver Info
        const { data: rider } = await supabase
            .from('riders')
            .select('id')
            .eq('phone', fromNumber)
            .single();

        if (!rider) return generateVoiceXML('<Hangup/>');

        const { data: driver } = await supabase
            .from('drivers')
            .select('id')
            .eq('rider_id', rider.id)
            .single();

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
           ${playOrSay('not-driving.mp3', 'איר זענט נישט מיועד צו דרייוון היינט.')}
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
      
      <Gather action="/api/ivr/driver-menu/process?rideId=${ride.id}" method="POST" numDigits="1" timeout="7">
         ${playOrSay('driver-menu.mp3', 'צו לאזן וויסן אז איר פארט יעצט ארויס ביטע דרוקט איינס. צו אפזאגן דעם קאר פאר היינט דרוקט צוויי.')}
      </Gather>
      <Hangup/>
    `;

        return generateVoiceXML(xml);
    } catch (error) {
        console.error('Driver Menu Error:', error);
        return generateVoiceXML('<Say>Error.</Say><Hangup/>');
    }
}
