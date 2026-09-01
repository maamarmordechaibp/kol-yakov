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
            if (digits === '4') {
                return generateVoiceXML(`<Redirect method="POST">/api/ivr/driver-menu/delay?rideId=${rideId}</Redirect>`);
            }
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

                // --- VIP STAFF AUTOMATIC RESCUE PROTOCOL ---
                const { data: cancelledBookings } = await supabase.from('bookings').select('id, rider_id, riders(role)').eq('daily_ride_id', rideId).eq('status', 'active');

                if (cancelledBookings && cancelledBookings.length > 0) {
                    const today = new Date().toISOString().split('T')[0];
                    // Find alternative active rides
                    const { data: altRides } = await supabase.from('daily_rides')
                        .select('id, drivers(car_capacity)')
                        .eq('ride_date', today)
                        .eq('status', 'scheduled')
                        .neq('id', rideId)
                        .order('estimated_departure_time', { ascending: true });

                    for (const b of cancelledBookings) {
                        const isStaff = (b.riders as any)?.role === 'staff';
                        let assignedNewRide = false;

                        if (isStaff && altRides && altRides.length > 0) {
                            // Find the first alt ride with capacity!
                            for (const altRide of altRides) {
                                const capacity = (altRide.drivers as any)?.car_capacity || 4;
                                const { count } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('daily_ride_id', altRide.id).eq('status', 'active');

                                if ((count || 0) < capacity) {
                                    // VIP Rescue success! Force them into this ride instantly!
                                    await supabase.from('bookings').update({ daily_ride_id: altRide.id }).eq('id', b.id);
                                    assignedNewRide = true;
                                    break;
                                }
                            }
                        }

                        // If not rescued (either bochur or no capacity), bump them
                        if (!assignedNewRide) {
                            await supabase.from('bookings').update({ status: 'pending', daily_ride_id: null }).eq('id', b.id);
                        }
                    }
                }

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


