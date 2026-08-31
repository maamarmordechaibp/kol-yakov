import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export const runtime = 'edge';

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
       drivers ( riders(name) ),
       riders ( name )
    `);

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

                    <table className="w-full text-left">
                        <thead className="bg-gray-100 rounded-t-lg">
                            <tr>
                                <th className="px-4 py-2 font-semibold text-sm">Staff Member</th>
                                <th className="px-4 py-2 font-semibold text-sm">Assigned Driver</th>
                                <th className="px-4 py-2 font-semibold text-sm">Day of Week</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {presets?.map(p => (
                                <tr key={p.id}>
                                    <td className="px-4 py-3 font-medium text-indigo-700">{(p.riders as any)?.name}</td>
                                    <td className="px-4 py-3 text-gray-800">{((p.drivers as any)?.riders as any)?.name}</td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][p.day_of_week]}
                                    </td>
                                </tr>
                            ))}
                            {(!presets || presets.length === 0) && (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">No staff presets assigned across any day.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </section>
            </div>
        </div>
    )
}
