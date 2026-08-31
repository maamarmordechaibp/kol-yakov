import { createClient } from '@/lib/supabase/server'
import { AddUserForm } from './AddUserForm'

export const runtime = 'edge';

export default async function RidersPage() {
    const supabase = await createClient()

    // Fetch all riders and see if they are a driver
    const { data: riders } = await supabase
        .from('riders')
        .select(`
      id, name, phone, role, balance,
      drivers ( id )
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
                {/* Form */}
                <div className="bg-white rounded-xl shadow-sm border p-6 h-fit">
                    <h2 className="font-semibold text-lg mb-4">Add New User</h2>
                    <AddUserForm />
                </div>

                {/* Data Table */}
                <div className="md:col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {riders?.map((r: any) => (
                                <tr key={r.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{r.name}</td>
                                    <td className="px-6 py-4 text-gray-500">{r.phone}</td>
                                    <td className="px-6 py-4 flex gap-2">
                                        {r.role === 'staff'
                                            ? <span className="text-xs bg-purple-100 text-purple-700 font-medium px-2 py-1 rounded">Staff</span>
                                            : <span className="text-xs bg-slate-100 text-slate-700 font-medium px-2 py-1 rounded">Bochur</span>
                                        }
                                        {r.drivers && r.drivers.length > 0 && (
                                            <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-1 rounded">Driver</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">${r.balance}</td>
                                </tr>
                            ))}
                            {(!riders || riders.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="text-center p-8 text-gray-500">No users found. Add one above!</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
