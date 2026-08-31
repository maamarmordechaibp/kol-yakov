import { createClient } from '@/lib/supabase/server'
import { RideStatus } from '@/types/database'



export default async function Home() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0];

  // Fetch today's rides with driver names and all active bookings
  const { data: rides, error } = await supabase
    .from('daily_rides')
    .select(`
      id,
      estimated_departure_time,
      status,
      drivers!inner (
        car_capacity,
        riders ( name )
      ),
      bookings (
        id,
        is_preset,
        riders ( name, role )
      )
    `)
    .eq('ride_date', today)
    .eq('bookings.status', 'active');

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Today's Rides</h1>
        <p className="text-gray-500 mt-1">Status and passenger list for all carpools today ({today})</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {rides?.map((ride: any) => (
          <RideCard key={ride.id} ride={ride} />
        ))}

        {(!rides || rides.length === 0) && (
          <div className="text-gray-500 border-2 border-dashed p-8 text-center rounded-xl col-span-full">
            No rides generated for today yet.
          </div>
        )}
      </div>
    </div>
  )
}

function RideCard({ ride }: { ride: any }) {
  const driverName = ride.drivers.riders?.name || 'Unknown Driver';
  const capacity = ride.drivers.car_capacity;
  const bookings = ride.bookings || [];

  const isDeparted = ride.status === 'departed';

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
      <div className={`p-4 text-white flex justify-between items-center ${isDeparted ? 'bg-gray-600' : 'bg-blue-600'}`}>
        <div className="font-semibold text-lg">{driverName}</div>
        <div className="text-sm font-medium bg-white/20 px-2 py-1 rounded">
          {ride.estimated_departure_time.substring(0, 5)}
        </div>
      </div>

      <div className="p-4 flex-1">
        <div className="flex justify-between items-center text-sm font-medium text-gray-400 mb-3 border-b pb-2">
          <span>{bookings.length} / {capacity} Seats Booked</span>
          <span className={isDeparted ? 'text-gray-500' : 'text-green-600'}>{isDeparted ? 'Departed' : 'Scheduled'}</span>
        </div>

        <ul className="space-y-2">
          {bookings.map((b: any) => (
            <li key={b.id} className="flex justify-between px-2 py-1.5 bg-gray-50 rounded text-sm">
              <span className="font-medium text-gray-700">{b.riders?.name}</span>
              {b.is_preset ? (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Preset</span>
              ) : (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Booked</span>
              )}
            </li>
          ))}
          {bookings.length === 0 && (
            <div className="text-sm text-gray-400 text-center py-2">Empty Car</div>
          )}
        </ul>
      </div>
    </div>
  )
}
