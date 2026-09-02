import { NextResponse } from 'next/server';
import { generateVoiceXML, playOrSay } from '@/lib/ivr-helper';

export async function POST(req: Request) {
    try {
        const url = new URL(req.url);
        const driverName = url.searchParams.get('driverName') || '';

        // Play the automated alert message
        const xml = `
            ${playOrSay('staff-reassign-alert.mp3', 'א גוטן. אייער פריערדיגע דרייווער האט אפגעזאגט דעם קאר פאר היינט. אייער פלאץ איז אטאמאטיש אריבערגעפירט געווארן צו דעם דרייווער:')}
            <Say voice="man">${driverName}</Say>
            <Hangup/>
        `;

        return generateVoiceXML(xml);
    } catch (error) {
        console.error(error);
        return generateVoiceXML('<Hangup/>');
    }
}
