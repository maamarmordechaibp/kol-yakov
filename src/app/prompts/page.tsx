import { createClient } from '@/lib/supabase/server'
import PromptsManager from './PromptsManager'



export default async function PromptsPage() {
    const supabase = await createClient()

    // 1. Fetch Drivers (for dynamic voice prompts)
    const { data: drivers } = await supabase
        .from('drivers')
        .select('id, audio_type, riders(name)')

    // 2. We need unique times to know what time prompts to record
    // Assuming times are in default_departure_time, we can just grab unique ones
    const { data: driverTimes } = await supabase
        .from('drivers')
        .select('default_departure_time')

    const uniqueTimes = Array.from(new Set(driverTimes?.map(d => d.default_departure_time.substring(0, 5)) || []))

    // Fetch the bucket files safely on the server side
    const { data: bucketData } = await supabase.storage.from('prompts').list()
    const initialBucketFiles = bucketData?.map(f => f.name) || []

    // 3. Build Checklist of EXPECTED files
    const expectedPrompts = [
        { filename: 'enter-home-phone.mp3', label: 'Registration: Enter Home Phone', script: 'מיר דערקענען נישט אייער נומער. ביטע דרוקט אייער צען ציפערן היים טעלעפאן נומער.' },
        { filename: 'confirm-profile.mp3', label: 'Registration: Profile Found, Press 1 to Confirm', script: 'צו נוצן די קאלער איי די פערמענאנט דרוקט איינס. צו נוצן די נומער נאר פאר יעצט, דרוקט צוויי.' },
        { filename: 'registration-success.mp3', label: 'Registration: Success, cell linked!', script: 'אייער סעלפאן נומער איז פערמענאנט באשטעטיגט געווארן.' },
        { filename: 'temp-session.mp3', label: 'Registration: Temporary session selected', script: 'איר נוצט די סיסטעם נאר פאר יעצט. ווען דער קאר פארט ארויס וועט די קאל אריינקומען צו אייער היים טעלעפאן נומער.' },
        { filename: 'phone-not-found.mp3', label: 'Registration: Error, Phone Not Found', script: 'מיר האבן נישט געטראפן די נומער אין אונזער סיסטעם.' },

        { filename: 'staff-rider-menu.mp3', label: 'Staff Menu Intro ("Press 1 to cancel")', script: 'דרוקט איינס צו אפזאגן אייער פלאץ פאר היינט.' },
        { filename: 'staff-cancel-confirmed.mp3', label: 'Staff Cancellation Confirmed', script: 'אייער פלאץ איז סוקסעספול אפגעזאגט געווארן פאר היינט.' },
        { filename: 'no-active-preset.mp3', label: 'Staff Error: No Preset for Today', script: 'איר האט נישט קיין סיט פאר היינט.' },

        { filename: 'no-rides-today.mp3', label: 'Bochur Error: No Rides Available Today', script: 'עס זענען נישטא קיין קארס פאר היינט. א גוטן טאג.' },
        { filename: 'no-seats.mp3', label: 'Bochur Error: Cars are Full', script: 'אלע קארס זענען ליידער שוין פול פאר היינט. א גוטן טאג.' },

        { filename: 'direction-menu.mp3', label: 'Phase 3: Up or Down?', script: 'צו פארן צום ישיבה, דרוקט איינס. צו פארן אהיים, דרוקט צוויי.' },
        { filename: 'seder-menu.mp3', label: 'Phase 3: Which Seder?', script: 'פאר פארטאגס סדר דרוקט 1. פאר שיעור עיון דרוקט 2. פאר שיעור פשוט דרוקט 3. פאר נאכט סדר דרוקט 4.' },
        { filename: 'no-cars-this-seder.mp3', label: 'Phase 3: Empty Seder', script: 'עס זענען נישטא קיין קארס יעצט פאר דעם סדר.' },
        { filename: 'seder-cars-full.mp3', label: 'Phase 3: Seder Full', script: 'אלע קארס פאר דעם סדר זענען שוין פול.' },

        { filename: 'rider-menu-intro.mp3', label: 'Bochur Menu Intro ("Available cars...")', script: 'דאס זענען די עוועילעבל קארס:' },
        { filename: 'booking-confirmed.mp3', label: 'Bochur Booking Confirmed!', script: 'אייער פלאץ דערווייל איז סוקסעספול באשטעטיגט געווארן! מיר וועלן אייך רופן ווען די קאר פארט ארויס.' },

        { filename: 'to-travel-with.mp3', label: 'Fragment: "To travel with..."', script: 'צו פארן מיט' },
        { filename: 'leaving-at.mp3', label: 'Fragment: "Leaving at..."', script: 'וואס פארט ארויס אום' },
        { filename: 'press.mp3', label: 'Fragment: "Press..."', script: 'דרוקט' },

        { filename: 'not-driving.mp3', label: 'Driver Menu Error: Not Scheduled', script: 'איר זענט נישט מיועד צו דרייוון היינט.' },
        { filename: 'you-have.mp3', label: 'Driver Menu: "You have..."', script: 'איר האט יעצט' },
        { filename: 'passengers.mp3', label: 'Driver Menu: "...passengers today"', script: 'פאסאזשירן פאר היינט.' },
        { filename: 'driver-menu.mp3', label: 'Driver Menu Intro ("Press 1 to depart")', script: 'צו לאזן וויסן אז איר פארט יעצט ארויס ביטע דרוקט איינס. צו אפזאגן דעם קאר פאר היינט דרוקט צוויי. צו נעמען וואקאציע פאר אפאר טעג דרוקט דריי. צו שפעטיגן אייער ארויספאר צייט, דרוקט פיר.' },
        { filename: 'delay-how-many-minutes.mp3', label: 'Driver Delay Menu: How many minutes?', script: 'פאר וויפיל מינוט שפעטיגט איר? ביטע דרוקט די נומער, נאכגעפאלגט מיטן פאונד קנעפל.' },
        { filename: 'delay-success.mp3', label: 'Driver Delay Menu: Success', script: 'איר האט סוקסעספול געשפעטיגט עיער ארויספאר צייט צו ' },

        { filename: 'vacation-prompt-intro.mp3', label: 'Driver Menu: Press 3 for Vacation Intro', script: 'צו רעפארטן אז איר פארט אוועק אויף וואקאציע, דרוקט דריי.' },
        { filename: 'vacation-how-many-days.mp3', label: 'Vacation Menu: How many days?', script: 'פאר וויפיל טעג דארפט איר וואקאציע? ביטע דרוקט די נומער פון טעג, נאכגעפאלגט מיטן פאונד קנעפל.' },
        { filename: 'vacation-success.mp3', label: 'Vacation Menu: Success!', script: 'א דאנק. די סיסטעם האט סוקסעספול פארשריבן אייער וואקאציע. א גוטן טאג.' },
        { filename: 'driver-departed-success.mp3', label: 'Driver action: Departed!', script: 'א גרויסן יישר כח, אלע פאסאזשירן באקומען יעצט א קאל צו אראפקומען.' },
        { filename: 'driver-cancel-success.mp3', label: 'Driver action: Cancelled Run!', script: 'דער קאר איז סוקסעספול אפגעזאגט געווארן. אלע פאסאזשירן וועלן אריבערגיין צום נעקסטן קאר.' },

        // Outbound Auto-Dial Alerts
        { filename: 'driver-is-outside.mp3', label: 'OUTBOUND ALERT: Driver Departs', script: 'א גוטן. מיר רופן צו לאזן וויסן אז דער קאר איז יעצט ארויסגעפארן. ביטע קומט אראפ. צו פארן מיט ' },
        { filename: 'driver-is-delayed.mp3', label: 'OUTBOUND ALERT: Driver Delayed', script: 'א גוטן. מיר רופן צו לאזן וויסן אז די קאר וועט זיך פארשפעטיגן. דער דרייווער וועט ארויספארן אום' },
        { filename: 'staff-reassign-alert.mp3', label: 'OUTBOUND ALERT: Staff Reassigned', script: 'א גוטן. אייער פריערדיגע דרייווער האט אפגעזאגט דעם קאר פאר היינט. אייער פלאץ איז אטאמאטיש אריבערגעפירט געווארן צו דעם דרייווער: ' },
    ]

    // Numbers have been removed from the checklist - they will use automated male Text-To-Speech

    // Add Dynamic Driver Names
    drivers?.forEach(d => {
        if (d.audio_type !== 'tts') {
            expectedPrompts.push({ filename: `r-${d.id}.mp3`, label: `Driver Name: ${(d.riders as any)?.name}`, script: `ליגט דער נאמען פון דעם דרייווער: ${(d.riders as any)?.name}` })
        }
    })

    // Add Dynamic Times
    uniqueTimes.forEach(t => {
        const formattedFileName = `time-${t.replace(':', '')}.mp3` // e.g. time-0730.mp3
        expectedPrompts.push({ filename: formattedFileName, label: `Time: ${t}`, script: `די צייט איז ${t}` })
    })

    return <PromptsManager expectedPrompts={expectedPrompts} initialBucketFiles={initialBucketFiles} />
}


