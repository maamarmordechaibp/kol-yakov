export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { generateVoiceXML, playOrSay } from '@/lib/ivr-helper';

export async function POST(req: Request) {
    try {
        const driverId = new URL(req.url).searchParams.get('driverId');

        const xml = `
          <Gather action="/api/ivr/driver-menu/vacation/process?driverId=${driverId}" method="POST" numDigits="2" timeout="10">
             ${playOrSay('vacation-how-many-days.mp3', 'פאר וויפיל טעג דארפט איר וואקאציע? ביטע דרוקט די נומער פון טעג, נאכגעפאלגט מיטן פאונד קנעפל.')}
          </Gather>
          <Hangup/>
        `;
        return generateVoiceXML(xml);
    } catch (error) {
        console.error(error);
        return generateVoiceXML('<Hangup/>');
    }
}


