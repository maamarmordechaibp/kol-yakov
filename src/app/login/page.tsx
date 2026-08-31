import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'



export default function LoginPage() {

    async function handleLogin(formData: FormData) {
        'use server'
        const password = formData.get('password')

        // We only need a single admin password for the dashboard
        if (password === 'kol123') {
            const cookieStore = await cookies()
            cookieStore.set('ky_admin_auth', 'authenticated', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 7 // 1 week
            })
            redirect('/')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 -mt-10">
            <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg border">

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 text-white text-2xl font-bold mb-4 shadow-sm">
                        ק
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Kol Yakov</h1>
                    <p className="text-gray-500 text-sm mt-1">Yeshiva Ride Management System</p>
                </div>

                <form action={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Admin Password
                        </label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition outline-none"
                            placeholder="Enter password..."
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-slate-900 text-white font-medium py-3 rounded-xl hover:bg-slate-800 transition shadow-sm"
                    >
                        Access Dashboard
                    </button>
                </form>

            </div>
        </div>
    )
}
