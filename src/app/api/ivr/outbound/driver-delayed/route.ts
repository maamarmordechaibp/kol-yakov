import { NextResponse } from 'next/server';
import { generateVoiceXML, playOrSay } from '@/lib/ivr-helper';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const url = new URL(req.url);
        const mins = url.searchParams.get('mins') || '';

        const supabase = await createClient();
        const { data: promptFiles } = await supabase.storage.from('prompts').list();
        const existingPrompts = promptFiles ? promptFiles.map(f => f.name) : [];

        const targetFileName = `min-${mins}.mp3`;
        let minutesAudioXML = '';
        if (existingPrompts.includes(targetFileName)) {
            minutesAudioXML = playOrSay(targetFileName, 'מינוט');
        } else {
            minutesAudioXML = `<Say voice="man">${mins} minutes</Say>`;
        }

        // Play the automated alert message
        const xml = `
            ${playOrSay('driver-is-delayed.mp3', 'א גוטן. מיר רופן צו לאזן וויסן אז די קאר פארשפעטיגט אויף נאך ')}
            ${minutesAudioXML}
            <Hangup/>
        `;

        return generateVoiceXML(xml);
    } catch (error) {
        console.error(error);
        return generateVoiceXML('<Hangup/>');
    }
}
