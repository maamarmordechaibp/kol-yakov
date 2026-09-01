'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Papa from 'papaparse'

export default function BulkUploadCSV() {
    const supabase = createClient()
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsLoading(true)
        setMessage('Parsing CSV...')

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const data = results.data as any[]
                setMessage(`Importing ${data.length} students...`)

                let successCount = 0
                let errorCount = 0

                for (const row of data) {
                    try {
                        let { Name, Phone } = row
                        // Standardize keys if they used different casing
                        const name = Name || row.name || row.NAME
                        const rawPhone = Phone || row.phone || row.PHONE || ''

                        if (!name || !rawPhone) {
                            errorCount++
                            continue
                        }

                        // Clean phone
                        let phone = rawPhone.replace(/\D/g, '')
                        if (phone.length === 10) phone = '+1' + phone
                        if (phone.length === 11 && phone.startsWith('1')) phone = '+' + phone

                        // Insert bochur
                        const { error } = await supabase.from('riders').insert({
                            name: name.trim(),
                            phone: phone,
                            role: 'rider',
                            is_active: true
                        })

                        if (error) {
                            console.error(error.message)
                            errorCount++
                        } else {
                            successCount++
                        }

                    } catch (err) {
                        errorCount++
                    }
                }

                setIsLoading(false)
                setMessage(`Done! Added ${successCount} bochurim. (${errorCount} failed/duplicates). Refreshing...`)
                if (inputRef.current) inputRef.current.value = ''

                setTimeout(() => window.location.reload(), 2000)
            }
        })
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border p-6 mt-6 h-fit">
            <h2 className="font-semibold text-lg mb-2">Bulk Import Students</h2>
            <p className="text-gray-500 text-sm mb-4">Upload a CSV file with exactly two columns: <strong>Name</strong> and <strong>Phone</strong>.</p>

            <input type="file" accept=".csv" ref={inputRef} className="hidden" onChange={handleUpload} />
            <button
                disabled={isLoading}
                onClick={() => inputRef.current?.click()}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 rounded-lg transition"
            >
                {isLoading ? 'Importing...' : 'Upload CSV File'}
            </button>
            {message && <p className="text-sm mt-3 text-emerald-600 font-medium">{message}</p>}
        </div>
    )
}
