import { NextResponse } from 'next/server';
import { generateVoiceXML, playOrSay } from '@/lib/ivr-helper';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const formData = await req.formData().catch(() => new URLSearchParams());
        const fromNumber = formData.get('From')?.toString() || '';
        let digits = formData.get('Digits')?.toString() || '';

        if (digits.length === 10) digits = '+1' + digits;

        const supabase = await createClient();
        const url = new URL(req.url);
        const confirmId = url.searchParams.get('confirmId');
        const confirmRole = url.searchParams.get('role'); // Get role to route properly

        if (confirmId) {
            // They just answered the 1 (permanent) or 2 (temporary) prompt
            const destinationMenu = confirmRole === 'driver' ? 'driver-menu' : (confirmRole === 'staff' ? 'staff-menu' : 'rider-menu');

            if (digits === '1') {
                // Permanently Link
                await supabase.from('riders').update({ phone: fromNumber }).eq('id', confirmId);
                return generateVoiceXML(`
                   ${playOrSay('registration-success.mp3', 'אייער סעלפאן נומער איז פערמענאנט באשטעטיגט געווארן.')}
                   <Redirect method="POST">/api/ivr/${destinationMenu}?riderId=${confirmId}</Redirect>
                `);
            } else if (digits === '2') {
                // Temporary Session
                return generateVoiceXML(`
                   ${playOrSay('temp-session.mp3', 'איר נוצט די סיסטעם נאר פאר יעצט. ווען דער קאר פארט ארויס וועט די קאל אריינקומען צו אייער היים טעלעפאן נומער.')}
                   <Redirect method="POST">/api/ivr/${destinationMenu}?riderId=${confirmId}</Redirect>
                `);
            } else {
                // Invalid choice
                return generateVoiceXML('<Redirect method="POST">/api/ivr/registration</Redirect>');
            }
        }

        // Search the DB for a rider with this inputted home phone number
        const { data: riders } = await supabase
            .from('riders')
            .select('id, name, role')
            .eq('phone', digits);

        if (riders && riders.length > 0) {
            const exactRider = riders[0];

            // Check if they are a driver so we can route them properly later
            let finalRole = exactRider.role;
            if (finalRole === 'staff') {
                const { data: driverCheck } = await supabase.from('drivers').select('id').eq('rider_id', exactRider.id).single();
                if (driverCheck) finalRole = 'driver';
            }

            const xml = `
              <Gather action="/api/ivr/registration/process?confirmId=${exactRider.id}&amp;role=${finalRole}" method="POST" numDigits="1" timeout="7">
                 ${playOrSay('confirm-profile.mp3', 'צו נוצן די קאלער איי די פערמענאנט דרוקט איינס. צו נוצן די נומער נאר פאר יעצט, דרוקט צוויי.')}
              </Gather>
              <Redirect method="POST">/api/ivr/registration</Redirect>
            `;
            return generateVoiceXML(xml);
        } else {
            const xml = `
              ${playOrSay('phone-not-found.mp3', 'מיר האבן נישט געטראפן די נומער אין אונזער סיסטעם.')}
              <Redirect method="POST">/api/ivr/registration</Redirect>
            `;
            return generateVoiceXML(xml);
        }
    } catch (error) {
        console.error(error);
        return generateVoiceXML('<Hangup/>');
    }
}


