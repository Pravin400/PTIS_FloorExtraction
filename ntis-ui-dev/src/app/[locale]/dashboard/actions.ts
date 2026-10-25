'use server';

/**
 * Server Actions for Dashboard
 * These functions run on the server and can be called from client components
 */

import { revalidatePath } from 'next/cache';

export interface DashboardData extends Record<string, unknown> {
  id: string;
  route: string;
  status: 'Active' | 'Delayed' | 'Completed';
  vehicles: number;
  lastUpdate: string;
}

// In-memory data store (simulating a database)
const dashboardRoutes: DashboardData[] = [
  {
    id: '1',
    route: 'North Route A',
    status: 'Active',
    vehicles: 12,
    lastUpdate: new Date().toISOString(),
  },
  {
    id: '2',
    route: 'South Route B',
    status: 'Delayed',
    vehicles: 8,
    lastUpdate: new Date().toISOString(),
  },
  {
    id: '3',
    route: 'East Route C',
    status: 'Active',
    vehicles: 15,
    lastUpdate: new Date().toISOString(),
  },
  {
    id: '4',
    route: 'West Route D',
    status: 'Completed',
    vehicles: 10,
    lastUpdate: new Date().toISOString(),
  },
];

/**
 * Fetches dashboard data (Server-side)
 */
export async function getDashboardData(): Promise<DashboardData[]> {
  return dashboardRoutes;
}

/**
 * Creates a new route
 * Server Action - called from client components
 * Returns success status for error handling
 */
export async function createRoute(
  data: Omit<DashboardData, 'id' | 'lastUpdate'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const newRoute = {
      ...data,
      id: String(Date.now()),
      lastUpdate: new Date().toISOString(),
    } as DashboardData;

    dashboardRoutes.push(newRoute);

    // Revalidate to trigger re-render
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    console.error('Create error:', error);
    return { success: false, error: 'Failed to create route' };
  }
}

/**
 * Deletes a route by ID
 * Server Action - called from client components
 * Returns success status for error handling
 */
export async function deleteRoute(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const index = dashboardRoutes.findIndex((route) => route.id === id);

    if (index === -1) {
      return { success: false, error: 'Route not found' };
    }

    dashboardRoutes.splice(index, 1);

    // Revalidate to trigger re-render
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error: 'Failed to delete route' };
  }
}
