import { NextResponse } from 'next/server';
import { generateVoiceXML, playOrSay } from '@/lib/ivr-helper';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // 1. Find all scheduled rides for today
        const today = new Date().toISOString().split('T')[0];
        const { data: rides } = await supabase
            .from('daily_rides')
            .select('id, estimated_departure_time, driver_id, drivers(car_capacity, rider_id)')
            .eq('ride_date', today)
            .eq('status', 'scheduled');

        if (!rides || rides.length === 0) {
            return generateVoiceXML(`
        ${playOrSay('no-rides-today.mp3', 'עס זענען נישטא קיין קארס פאר היינט. א גוטן טאג.')}
        <Hangup/>
      `);
        }

        // 2. Map through rides and check capacity
        let availableRides = [];
        for (const ride of rides) {
            // Find active bookings (preset or otherwise) for this ride
            const { count } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('daily_ride_id', ride.id)
                .eq('status', 'active');

            const activeBookings = count || 0;
            // Note: Supabase types can be tricky with nested JSON, so we cast to any here safely
            const carCapacity = (ride.drivers as any)?.car_capacity || 4;

            if (activeBookings < carCapacity) {
                availableRides.push(ride);
            }
        }

        if (availableRides.length === 0) {
            return generateVoiceXML(`
        ${playOrSay('no-seats.mp3', 'אלע קארס זענען ליידער שוין פול פאר היינט. א גוטן טאג.')}
        <Hangup/>
      `);
        }

        // 3. Build the menu for available rides
        const rideIds = availableRides.map(r => r.id).join(',');
        let gatherXml = `<Gather action="/api/ivr/rider-menu/process?rides=${rideIds}" method="POST" numDigits="1" timeout="7">`;

        // Play intro: "Here are the available rides. Press 1 for..."
        gatherXml += playOrSay('rider-menu-intro.mp3', 'דאס זענען די עוועילעבל קארס פאר היינט:');

        availableRides.forEach((ride, index) => {
            // Announce the driver and standard number pressing
            const pressNumber = index + 1; // 1, 2, 3...
            gatherXml += `
        ${playOrSay('to-travel-with.mp3', 'צו פארן מיט')}
        ${playOrSay(`r-${ride.driver_id}.mp3`, 'דעם דרייווער')}
        ${playOrSay('leaving-at.mp3', 'וואס פארט ארויס אום')}
        ${playOrSay(`time-${ride.estimated_departure_time.replace(/:/g, '')}.mp3`, 'די צייט')}
        ${playOrSay('press.mp3', 'דרוקט')}
        ${playOrSay(`${pressNumber}.mp3`, String(pressNumber))}
      `;
        });

        gatherXml += `</Gather>`;

        return generateVoiceXML(gatherXml);

    } catch (error) {
        console.error('Rider Menu Error:', error);
        return generateVoiceXML('<Say>Error.</Say><Hangup/>');
    }
}
