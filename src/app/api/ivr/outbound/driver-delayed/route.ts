import { NextResponse } from 'next/server';
import { generateVoiceXML, playOrSay } from '@/lib/ivr-helper';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const url = new URL(req.url);
        const timeHH = url.searchParams.get('hh') || '';
        const timeMM = url.searchParams.get('mm') || '';

        const supabase = await createClient();
        const { data: promptFiles } = await supabase.storage.from('prompts').list();
        const existingPrompts = promptFiles ? promptFiles.map(f => f.name) : [];

        const targetFileName = `time-${timeHH}${timeMM}.mp3`;
        let timeAudioXML = '';
        if (existingPrompts.includes(targetFileName)) {
            timeAudioXML = playOrSay(targetFileName, 'די צייט');
        } else {
            const hr = parseInt(timeHH);
            const ampm = hr >= 12 ? 'PM' : 'AM';
            let hr12 = hr % 12;
            if (hr12 === 0) hr12 = 12;
            timeAudioXML = `<Say voice="man">${hr12} ${timeMM} ${ampm}</Say>`;
        }

        // Play the automated alert message
        const xml = `
            ${playOrSay('driver-is-delayed.mp3', 'א גוטן. מיר רופן צו לאזן וויסן אז די קאר וועט זיך פארשפעטיגן. דער דרייווער וועט ארויספארן אום')}
            ${timeAudioXML}
            <Hangup/>
        `;

        return generateVoiceXML(xml);
    } catch (error) {
        console.error(error);
        return generateVoiceXML('<Hangup/>');
    }
}
