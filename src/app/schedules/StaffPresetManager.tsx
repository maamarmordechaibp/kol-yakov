'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Plus, CalendarDays } from 'lucide-react'

export default function StaffPresetManager({ initialPresets, staff, drivers }: { initialPresets: any[], staff: any[], drivers: any[] }) {
    const supabase = createClient()
    const [presets, setPresets] = useState(initialPresets)

    // Form state
    const [selectedStaff, setSelectedStaff] = useState('')
    const [selectedDriver, setSelectedDriver] = useState('')
    const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4]) // Default Sun-Thu
    const [direction, setDirection] = useState('up')
    const [seder, setSeder] = useState('shiur_iyun')

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this permanent assignment?')) return
        setPresets(prev => prev.filter(p => p.id !== id))
        await supabase.from('staff_presets').delete().eq('id', id)
    }

    const toggleDay = (dayIndex: number) => {
        setSelectedDays(prev =>
            prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]
        )
    }

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedStaff || !selectedDriver || selectedDays.length === 0) {
            alert('Please select staff, driver, and at least one day.')
            return
        }

        const payloads = selectedDays.map(day => ({
            rider_id: selectedStaff,
            driver_id: selectedDriver,
            day_of_week: day,
            direction: direction,
            seder: seder
        }))

        // Bulk insert array
        const { data, error } = await supabase.from('staff_presets').insert(payloads).select(`
            id, day_of_week, direction, seder,
            drivers ( riders(name) ),
            riders ( name )
        `);

        if (error) {
            alert('Error adding preset. This staff member might already be booked for this specific direction/seder on one of the selected days.')
            console.error(error)
        } else if (data) {
            setPresets(prev => [...prev, ...data])
            // Reset to defaults
            setSelectedDays([0, 1, 2, 3, 4])
        }
    }

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    return (
        <div className="glass-panel rounded-2xl overflow-hidden mb-8 shadow-sm">

            <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <CalendarDays className="text-indigo-400" size={18} /> Staff Auto-Assign Array
                    </h2>
                    <p className="text-xs text-slate-400 font-medium tracking-wide">Assign permanent weekly seats for faculty members</p>
                </div>
            </div>

            {/* Add New Preset Form */}
            <form onSubmit={handleAdd} className="p-6 bg-white border-b flex flex-col gap-5">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-slate-500 mb-2 tracking-wide uppercase">Staff Member</label>
                        <select required value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)} className="w-full text-sm border-2 border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:border-indigo-500 focus:ring-0 outline-none transition-colors font-medium">
                            <option value="">-- Select Staff --</option>
                            {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-slate-500 mb-2 tracking-wide uppercase">Assign to Driver</label>
                        <select required value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)} className="w-full text-sm border-2 border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:border-indigo-500 focus:ring-0 outline-none transition-colors font-medium">
                            <option value="">-- Select Driver --</option>
                            {drivers.map(d => <option key={d.id} value={d.id}>{(d.riders as any)?.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-bold text-slate-500 mb-2 tracking-wide uppercase">Direction</label>
                        <select value={direction} onChange={e => setDirection(e.target.value)} className="w-full text-sm border-2 border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:border-indigo-500 font-bold text-slate-700 outline-none">
                            <option value="up">Going UP (To School)</option>
                            <option value="down">Going DOWN (To Home)</option>
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-slate-500 mb-2 tracking-wide uppercase">Seder Slot</label>
                        <select value={seder} onChange={e => setSeder(e.target.value)} className="w-full text-sm border-2 border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:border-indigo-500 font-bold text-slate-700 outline-none">
                            <option value="fartuk_seder">1. Fartuk Seder (Early Morning)</option>
                            <option value="shiur_iyun">2. Shiur Iyun (Morning)</option>
                            <option value="shiur_pshut">3. Shiur Pshut (Afternoon)</option>
                            <option value="nacht_seder">4. Nacht Seder (Night)</option>
                        </select>
                    </div>
                </div>

                <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-500 mb-3 tracking-wide uppercase">Days of the Week (Bulk Assign)</label>
                    <div className="flex flex-wrap gap-2">
                        {days.map((d, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => toggleDay(i)}
                                className={`px-4 py-2 text-xs font-bold rounded-lg border-2 transition-all duration-200 ${selectedDays.includes(i) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-100'}`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-4 flex items-center justify-end">
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm flex gap-2 items-center shadow-lg shadow-indigo-600/30 btn-animate">
                        <Plus size={18} /> Bulk Assign Staff Run
                    </button>
                </div>
            </form>

            <table className="w-full text-left bg-white/50 backdrop-blur-md">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="px-4 py-2 font-semibold text-sm">Staff Member</th>
                        <th className="px-4 py-2 font-semibold text-sm">Assigned Driver</th>
                        <th className="px-4 py-2 font-semibold text-sm">Day of Week</th>
                        <th className="px-4 py-2 font-semibold text-sm">Direction</th>
                        <th className="px-4 py-2 font-semibold text-sm">Seder</th>
                        <th className="px-4 py-2 font-semibold text-sm text-right">Delete</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {presets?.map(p => (
                        <tr key={p.id}>
                            <td className="px-4 py-3 font-medium text-indigo-700">{(p.riders as any)?.name}</td>
                            <td className="px-4 py-3 text-gray-800">{((p.drivers as any)?.riders as any)?.name}</td>
                            <td className="px-4 py-3 text-slate-500 font-bold max-w-24 border-l">{fullDays[p.day_of_week]}</td>
                            <td className="px-4 py-3">
                                {p.direction === 'up' ? <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold w-max">⬆️ UP</span> : <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold w-max">⬇️ DOWN</span>}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                                {p.seder === 'fartuk_seder' && 'Fartuk Seder'}
                                {p.seder === 'shiur_iyun' && 'Shiur Iyun'}
                                {p.seder === 'shiur_pshut' && 'Shiur Pshut'}
                                {p.seder === 'nacht_seder' && 'Nacht Seder'}
                                {!p.seder && 'Generic'}
                            </td>
                            <td className="px-4 py-3 text-right">
                                <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                            </td>
                        </tr>
                    ))}
                    {presets.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No staff presets assigned across any day.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
