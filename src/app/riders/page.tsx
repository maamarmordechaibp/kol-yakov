import { createClient } from '@/lib/supabase/server'
import { AddUserForm } from './AddUserForm'
import BulkUploadCSV from './BulkUploadCSV'
import RiderTable from './RiderTable'

export default async function RidersPage() {
    const supabase = await createClient()

    // Fetch all riders and see if they are a driver
    const { data: riders } = await supabase
        .from('riders')
        .select(`
      id, name, phone, role, balance, is_active,
      drivers ( id, audio_type )
    `)
        .order('created_at', { ascending: false })

    return (
        <div className="p-8">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Users &amp; Staff</h1>
                    <p className="text-gray-500 mt-1">Manage bochurim, staff, and drivers.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Form Col */}
                <div className="h-fit flex flex-col">
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h2 className="font-semibold text-lg mb-4">Add New User</h2>
                        <AddUserForm />
                    </div>

                    <BulkUploadCSV />
                </div>

                {/* Data Table */}
                <RiderTable initialRiders={riders || []} />
            </div>
        </div>
    )
}
