// A wrapper around fetch to handle API requests, headers, and errors.
// This prepares the app for a real backend.

const BASE_URL = '/api'; // All API requests will be prefixed with /api

// This would hold the auth token (e.g., JWT) after login.
let authToken: string | null = localStorage.getItem('authToken');

const setAuthToken = (token: string | null) => {
    authToken = token;
    if (token) {
        localStorage.setItem('authToken', token);
    } else {
        localStorage.removeItem('authToken');
    }
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const config: RequestInit = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            // Try to parse error message from backend, otherwise use status text
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                // Not a JSON response
            }
            const errorMessage = errorData?.message || response.statusText;
            throw new Error(errorMessage);
        }
        
        // Handle responses with no content
        if (response.status === 204) {
            return null as T;
        }

        return await response.json();
    } catch (error) {
        console.error(`API request to ${endpoint} failed:`, error);
        throw error; // Re-throw the error to be handled by the calling function
    }
}

// --- API Service Methods ---
import { User, RegistrationData, LegalCase, Property, Tenant, LawFirm } from '../types';

export const api = {
    auth: {
        login: (credentials: { username: string; password: string }): Promise<{ token: string; user: User }> =>
            request('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials),
            }),
        register: (data: RegistrationData): Promise<{ token: string; user: User }> =>
            request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        getCurrentUser: (): Promise<{ user: User }> =>
            request('/auth/me', { method: 'GET' }),
    },
    users: {
        updateProfile: (data: Partial<User>): Promise<User> => 
            request('/users/profile', {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        // Admin user management
        getAllLandlords: (): Promise<User[]> => request('/admin/users/landlords'),
        getAllContractors: (): Promise<User[]> => request('/admin/users/contractors'),
        createClient: (data: RegistrationData): Promise<User> => request('/admin/users/clients', { method: 'POST', body: JSON.stringify(data) }),
        updateClient: (userId: string, data: Partial<User>): Promise<User> => request(`/admin/users/clients/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),
        deleteUser: (userId: string): Promise<void> => request(`/admin/users/${userId}`, { method: 'DELETE' }),
    },
    properties: {
        getAll: (): Promise<Property[]> => request('/properties'),
        create: (data: Omit<Property, 'id' | 'landlordId'>): Promise<Property> => request('/properties', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: Partial<Property>): Promise<Property> => request(`/properties/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string): Promise<void> => request(`/properties/${id}`, { method: 'DELETE' }),
    },
    tenants: {
        getAll: (): Promise<Tenant[]> => request('/tenants'),
        create: (data: Omit<Tenant, 'id' | 'landlordId'>): Promise<Tenant> => request('/tenants', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: Partial<Tenant>): Promise<Tenant> => request(`/tenants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string): Promise<void> => request(`/tenants/${id}`, { method: 'DELETE' }),
    },
    cases: {
        getAll: (): Promise<LegalCase[]> => request('/cases'),
        create: (data: Omit<LegalCase, 'id' | 'landlordId' | 'dateInitiated' | 'status' | 'paymentStatus'>): Promise<LegalCase> => request('/cases', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: Partial<LegalCase>): Promise<LegalCase> => request(`/cases/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string): Promise<void> => request(`/cases/${id}`, { method: 'DELETE' }),
        // Admin case management
        getAllForAdmin: (): Promise<LegalCase[]> => request('/admin/cases'),
    },
    lawFirms: {
        getAll: (): Promise<LawFirm[]> => request('/admin/law-firms'),
        create: (data: Omit<LawFirm, 'id'>): Promise<LawFirm> => request('/admin/law-firms', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: Partial<LawFirm>): Promise<LawFirm> => request(`/admin/law-firms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string): Promise<void> => request(`/admin/law-firms/${id}`, { method: 'DELETE' }),
    },
    contact: {
        sendEmail: (data: { subject: string, body: string }): Promise<void> => request('/contact', { method: 'POST', body: JSON.stringify(data)}),
    },
    dashboard: {
        getStats: (): Promise<{ tenantCount: number; activeCasesCount: number; }> => request('/dashboard/stats'),
    },
    checkout: {
        createSession: (data: { itemIds: string[] }): Promise<{ checkoutUrl: string }> =>
            request('/checkout/create-session', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        verifySession: (sessionId: string): Promise<{ success: boolean; cases: LegalCase[] }> =>
            request(`/checkout/verify-session?session_id=${sessionId}`),
        cancelSession: (data: { sessionId: string }): Promise<{ success: boolean }> =>
            request('/checkout/cancel-session', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
    }
};

export { setAuthToken };
