import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import StaffPresetManager from './StaffPresetManager'

export default async function SchedulesPage() {
    const supabase = await createClient()

    // Fetch drivers and their schedules
    const { data: drivers } = await supabase
        .from('drivers')
        .select(`
      id,
      car_capacity,
      default_departure_time,
      riders(name, phone)
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
                {/* Drivers Section */}
                <section className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Drivers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {drivers?.map(d => (
                            <div key={d.id} className="border rounded-lg p-4 bg-gray-50 flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold text-lg">{(d.riders as any)?.name}</h3>
                                    <p className="text-sm text-gray-500">Capacity: {d.car_capacity} seats</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium bg-white px-3 py-1 rounded shadow-sm border">
                                        Default: {d.default_departure_time.substring(0, 5)}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!drivers || drivers.length === 0) && <p className="text-gray-500">No drivers added yet.</p>}
                    </div>
                </section>

                {/* Staff Presets Section */}
                <section className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h2 className="text-xl font-bold text-gray-800">Staff Preset Assignments</h2>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                        Staff members listed here are <b>automatically</b> booked onto these drivers for the days specified, guaranteeing them a seat.
                    </p>

                    <StaffPresetManager initialPresets={presets || []} staff={staff || []} drivers={drivers || []} />
                </section>
            </div>
        </div>
    )
}
