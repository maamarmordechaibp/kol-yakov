export type RiderRole = 'staff' | 'bochur';
export type RideStatus = 'scheduled' | 'departed' | 'cancelled';

export interface Database {
    public: {
        Tables: {
            riders: {
                Row: {
                    id: string;
                    name: string;
                    phone: string;
                    role: RiderRole;
                    balance: number;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['riders']['Row'], 'id' | 'created_at' | 'balance' | 'role'> & { balance?: number; role?: RiderRole };
                Update: Partial<Database['public']['Tables']['riders']['Insert']>;
            };
            drivers: {
                Row: {
                    id: string;
                    rider_id: string;
                    car_capacity: number;
                    home_address: string | null;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['drivers']['Row'], 'id' | 'created_at' | 'car_capacity'> & { car_capacity?: number };
                Update: Partial<Database['public']['Tables']['drivers']['Insert']>;
            };
            pickup_locations: {
                Row: {
                    id: string;
                    label: string;
                    address: string | null;
                    is_default: boolean;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['pickup_locations']['Row'], 'id' | 'created_at' | 'is_default'> & { is_default?: boolean };
                Update: Partial<Database['public']['Tables']['pickup_locations']['Insert']>;
            };
            driver_schedules: {
                Row: {
                    id: string;
                    driver_id: string;
                    day_of_week: number;
                    departure_time: string;
                    is_active: boolean;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['driver_schedules']['Row'], 'id' | 'created_at' | 'is_active'> & { is_active?: boolean };
                Update: Partial<Database['public']['Tables']['driver_schedules']['Insert']>;
            };
            staff_presets: {
                Row: {
                    id: string;
                    rider_id: string;
                    driver_id: string;
                    day_of_week: number;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['staff_presets']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['staff_presets']['Insert']>;
            };
            daily_rides: {
                Row: {
                    id: string;
                    driver_id: string;
                    ride_date: string;
                    estimated_departure_time: string;
                    pickup_location_id: string | null;
                    status: RideStatus;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['daily_rides']['Row'], 'id' | 'created_at' | 'status'> & { status?: RideStatus };
                Update: Partial<Database['public']['Tables']['daily_rides']['Insert']>;
            };
            bookings: {
                Row: {
                    id: string;
                    daily_ride_id: string;
                    rider_id: string;
                    is_preset: boolean;
                    is_paid: boolean;
                    status: 'active' | 'cancelled';
                    booked_at: string;
                };
                Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'booked_at' | 'is_preset' | 'is_paid' | 'status'> & { is_preset?: boolean; is_paid?: boolean; status?: 'active' | 'cancelled' };
                Update: Partial<Database['public']['Tables']['bookings']['Insert']>;
            };
            payments: {
                Row: {
                    id: string;
                    rider_id: string;
                    amount: number;
                    payment_date: string;
                    method: string;
                };
                Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'payment_date' | 'method'> & { method?: string };
                Update: Partial<Database['public']['Tables']['payments']['Insert']>;
            };
            vacation_blocks: {
                Row: {
                    id: string;
                    driver_id: string;
                    start_date: string;
                    end_date: string;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['vacation_blocks']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['vacation_blocks']['Insert']>;
            };
            call_logs: {
                Row: {
                    id: string;
                    phone: string;
                    direction: 'inbound' | 'outbound';
                    flow: string;
                    duration_seconds: number;
                    timestamp: string;
                };
                Insert: Omit<Database['public']['Tables']['call_logs']['Row'], 'id' | 'timestamp' | 'duration_seconds'> & { duration_seconds?: number };
                Update: Partial<Database['public']['Tables']['call_logs']['Insert']>;
            };
        };
    };
}
