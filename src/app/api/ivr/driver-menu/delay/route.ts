import { NextResponse } from 'next/server';
import { generateVoiceXML, playOrSay } from '@/lib/ivr-helper';

export async function POST(req: Request) {
    try {
        const rideId = new URL(req.url).searchParams.get('rideId');

        const xml = `
          <Gather action="/api/ivr/driver-menu/delay/process?rideId=${rideId}" method="POST" numDigits="3" timeout="10">
             ${playOrSay('delay-how-many-minutes.mp3', 'פאר וויפיל מינוט שפעטיגט איר? ביטע דרוקט די נומער, נאכגעפאלגט מיטן פאונד קנעפל.')}
          </Gather>
          <Hangup/>
        `;
        return generateVoiceXML(xml);
    } catch (error) {
        console.error(error);
        return generateVoiceXML('<Hangup/>');
    }
}
