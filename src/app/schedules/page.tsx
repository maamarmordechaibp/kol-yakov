import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import StaffPresetManager from './StaffPresetManager'
import DriverWeeklyScheduler from './DriverWeeklyScheduler'

export default async function SchedulesPage() {
    const supabase = await createClient()

    // Fetch drivers and their UI representations
    const { data: drivers } = await supabase
        .from('drivers')
        .select(`
      id,
      car_capacity,
      default_departure_time,
      riders(name, phone)
    `);

    // Fetch driver weekly recurring schedules
    const { data: driverSchedules } = await supabase
        .from('driver_weekly_schedules')
        .select(`
        id,
        direction,
        seder,
        departure_time,
        days_of_week,
        drivers ( riders(name) )
        `);

    // Fetch preset staff links
    const { data: presets } = await supabase
        .from('staff_presets')
        .select(`
       id,
       day_of_week,
       direction,
       drivers ( riders(name) ),
       riders ( name )
    `);

    // Fetch staff for dropdown
    const { data: staff } = await supabase.from('riders').select('id, name').eq('role', 'staff').order('name');

    return (
        <div className="p-8 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Schedules & Presets</h1>
                <p className="text-gray-500 mt-1">Manage driver departure times and automatic staff seating.</p>
            </div>

            <div className="space-y-8">
                <DriverWeeklyScheduler initialSchedules={driverSchedules || []} drivers={drivers || []} />
                <StaffPresetManager initialPresets={presets || []} staff={staff || []} drivers={drivers || []} />
            </div>
        </div>
    )
}
