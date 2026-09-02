import { NextResponse } from 'next/server';
import { generateVoiceXML, playOrSay } from '@/lib/ivr-helper';
import { createClient } from '@/lib/supabase/server';



export async function POST(req: Request) {
    try {
        const formData = await req.formData().catch(() => new URLSearchParams());
        const fromNumber = formData.get('From')?.toString() || '';
        const supabase = await createClient();

        let riderId = new URL(req.url).searchParams.get('riderId');

        if (!riderId) {
            const last10 = fromNumber.replace(/\D/g, '').slice(-10);
            const { data: riders } = await supabase.from('riders').select('id').ilike('phone', `%${last10}`);
            if (!riders || riders.length === 0) return generateVoiceXML('<Hangup/>');
            riderId = riders[0].id;
        }

        let gatherXml = `<Gather action="/api/ivr/rider-menu/seder?riderId=${riderId}" method="POST" numDigits="1" timeout="7">`;
        gatherXml += playOrSay('direction-menu.mp3', 'צו פארן צום ישיבה, דרוקט איינס. צו פארן אהיים, דרוקט צוויי.');
        gatherXml += `</Gather><Hangup/>`;

        return generateVoiceXML(gatherXml);

    } catch (error) {
        console.error('Rider Menu Error:', error);
        return generateVoiceXML('<Say>Error.</Say><Hangup/>');
    }
}


