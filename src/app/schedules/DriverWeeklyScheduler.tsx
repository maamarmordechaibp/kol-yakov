'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Plus, Route } from 'lucide-react'

export default function DriverWeeklyScheduler({ initialSchedules, drivers }: { initialSchedules: any[], drivers: any[] }) {
    const supabase = createClient()
    const [schedules, setSchedules] = useState(initialSchedules)

    // Form state
    const [selectedDriver, setSelectedDriver] = useState('')
    const [direction, setDirection] = useState('up')
    const [seder, setSeder] = useState('shiur_iyun')
    const [departureTime, setDepartureTime] = useState('07:30')
    const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4]) // Default Sun-Thu

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this permanent driving schedule?')) return
        setSchedules(prev => prev.filter(p => p.id !== id))
        await supabase.from('driver_weekly_schedules').delete().eq('id', id)
    }

    const toggleDay = (dayIndex: number) => {
        setSelectedDays(prev =>
            prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]
        )
    }

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedDriver || selectedDays.length === 0 || !departureTime) {
            alert('Please fill out all fields and select days.')
            return
        }

        const payload = {
            driver_id: selectedDriver,
            direction,
            seder,
            departure_time: departureTime + ':00', // Time format Requires seconds
            days_of_week: selectedDays
        }

        const { data, error } = await supabase.from('driver_weekly_schedules').insert(payload).select(`
            *,
            drivers ( riders(name) )
        `).single();

        if (error) {
            alert('Error adding driving schedule.')
            console.error(error)
        } else if (data) {
            setSchedules(prev => [...prev, data])
            // Keep days as is, just clear driver maybe?
            setSelectedDays([0, 1, 2, 3, 4])
        }
    }

    const daysList = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    const renderDays = (arr: number[]) => {
        return arr.sort().map(d => daysList[d]).join(', ');
    }

    return (
        <div className="glass-panel rounded-2xl overflow-hidden mb-8 shadow-sm">

            <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Route className="text-indigo-400" size={18} /> Driver Recurring Route Engine
                    </h2>
                    <p className="text-xs text-slate-400 font-medium tracking-wide">Assign permanent weekly runs for drivers across different Sedarim</p>
                </div>
            </div>

            {/* Add New Schedule Form */}
            <form onSubmit={handleAdd} className="p-6 bg-white border-b flex flex-col gap-5">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-slate-500 mb-2 tracking-wide uppercase">Driver</label>
                        <select required value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)} className="w-full text-sm border-2 border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:border-indigo-500 focus:ring-0 outline-none transition-colors font-medium">
                            <option value="">-- Select Driver --</option>
                            {drivers.map(d => <option key={d.id} value={d.id}>{(d.riders as any)?.name}</option>)}
                        </select>
                    </div>

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

                    <div className="flex-[0.5] min-w-[120px]">
                        <label className="block text-xs font-bold text-slate-500 mb-2 tracking-wide uppercase">Time</label>
                        <input type="time" required value={departureTime} onChange={e => setDepartureTime(e.target.value)} className="w-full text-sm border-2 border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:border-indigo-500 outline-none" />
                    </div>
                </div>

                <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-500 mb-3 tracking-wide uppercase">Days of the Week (Active Driving Days)</label>
                    <div className="flex flex-wrap gap-2">
                        {daysList.map((d, i) => (
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
                        <Plus size={18} /> Generate Route
                    </button>
                </div>
            </form>

            <table className="w-full text-left bg-white/50 backdrop-blur-md">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-500">Driver Name</th>
                        <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-500">Direction</th>
                        <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-500">Seder</th>
                        <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-500">Time</th>
                        <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-500">Recurrance (Days)</th>
                        <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-500 text-right">Remove</th>
                    </tr>
                </thead>
                <tbody className="divide-y border-t border-slate-200">
                    {schedules?.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-4 font-bold text-indigo-700">{((p.drivers as any)?.riders as any)?.name}</td>
                            <td className="px-4 py-4">
                                {p.direction === 'up' ? <span className="bg-blue-100 text-blue-700 px-2.5 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm">⬆️ UP</span> : <span className="bg-orange-100 text-orange-700 px-2.5 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm">⬇️ DOWN</span>}
                            </td>
                            <td className="px-4 py-4 text-slate-600 font-bold text-sm">
                                {p.seder === 'fartuk_seder' && 'Fartuk Seder'}
                                {p.seder === 'shiur_iyun' && 'Shiur Iyun'}
                                {p.seder === 'shiur_pshut' && 'Shiur Pshut'}
                                {p.seder === 'nacht_seder' && 'Nacht Seder'}
                            </td>
                            <td className="px-4 py-4 font-bold text-slate-800">{p.departure_time.substring(0, 5)}</td>
                            <td className="px-4 py-4 text-slate-500 font-bold max-w-48 leading-relaxed text-sm">{renderDays(p.days_of_week)}</td>
                            <td className="px-4 py-4 text-right">
                                <button onClick={() => handleDelete(p.id)} className="text-slate-400 hover:text-red-500 transition-colors hover:bg-red-50 p-2 rounded-lg">
                                    <Trash2 size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {schedules.length === 0 && (
                        <tr><td colSpan={6} className="px-8 py-12 text-center text-slate-500 font-medium">No recurring weekly routes exist. Let's create one.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
