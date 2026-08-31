'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { Trash2, UploadCloud, Volume2 } from 'lucide-react'

export default function PromptsPage() {
    const supabase = createClient()
    const [files, setFiles] = useState<any[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState('')

    useEffect(() => {
        fetchFiles()
    }, [])

    async function fetchFiles() {
        const { data } = await supabase.storage.from('prompts').list()
        if (data) {
            setFiles(data.filter(f => f.name !== '.emptyFolderPlaceholder'))
        }
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return

        setIsUploading(true)
        const fileList = Array.from(e.target.files)

        for (const file of fileList) {
            setUploadProgress(`Uploading ${file.name}...`)
            // Upload or replace the file in the public 'prompts' bucket
            await supabase.storage.from('prompts').upload(file.name, file, {
                cacheControl: '3600',
                upsert: true
            })
        }

        setIsUploading(false)
        setUploadProgress('')
        fetchFiles() // Refresh list
    }

    async function handleDelete(fileName: string) {
        if (confirm(`Are you sure you want to delete ${fileName}?`)) {
            await supabase.storage.from('prompts').remove([fileName])
            fetchFiles()
        }
    }

    // Get the public URL for playback
    const getAudioUrl = (fileName: string) => {
        return supabase.storage.from('prompts').getPublicUrl(fileName).data.publicUrl
    }

    return (
        <div className="p-8 max-w-5xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Voice Prompts Management</h1>
                <p className="text-gray-500 mt-1">Upload your Yiddish MP3 recordings here. They will automatically play on the IVR.</p>
            </div>

            <div className="mb-8 p-6 bg-white border border-dashed border-gray-300 rounded-xl shadow-sm text-center transition hover:bg-gray-50 relative">
                <input
                    type="file"
                    accept="audio/mp3,audio/mpeg"
                    multiple
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                />
                <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                    <UploadCloud size={40} className="text-blue-500" />
                    <span className="font-semibold text-lg text-gray-700">
                        {isUploading ? uploadProgress : 'Click or drag MP3 files here to upload'}
                    </span>
                    <span className="text-sm text-gray-400">Make sure to name them exactly as generated (e.g. `rider-menu-intro.mp3`)</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">File Name</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Size</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Playback</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y relative">
                        {files.map(f => (
                            <tr key={f.name} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                                    <Volume2 size={16} className="text-gray-400" /> {f.name}
                                </td>
                                <td className="px-6 py-4 text-gray-500">{(f.metadata?.size / 1024).toFixed(1)} KB</td>
                                <td className="px-6 py-4 text-center">
                                    <audio controls className="h-8 w-48 mx-auto" src={getAudioUrl(f.name)} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleDelete(f.name)} className="text-red-500 hover:text-red-700 p-2">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {files.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center p-8 text-gray-500">No MP3 files uploaded yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    )
}
