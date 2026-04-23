import { Injectable } from '@angular/core';

export type Customer = {
  id: string;
  name: string;
  email: string;
  city?: string | null;
  status?: string | null;
};

export type Segment = {
  id: string;
  name: string;
  type: string;
  memberCount?: number;
};

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:3000';

  async getCustomers(): Promise<Customer[]> {
    const response = await fetch(`${this.baseUrl}/customers`);
    if (!response.ok) {
      throw new Error('Failed to load customers');
    }
    return response.json();
  }

  async getSegments(): Promise<Segment[]> {
    const response = await fetch(`${this.baseUrl}/segments`);
    if (!response.ok) {
      throw new Error('Failed to load segments');
    }
    return response.json();
  }

  async addTransaction(payload: { customerId: string; amount: number; occurredAt?: string }) {
    const response = await fetch(`${this.baseUrl}/simulate/transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to add transaction');
    }

    return response.json();
  }

  async updateProfile(payload: {
    customerId: string;
    name?: string;
    city?: string;
    status?: string;
  }) {
    const response = await fetch(`${this.baseUrl}/simulate/profile-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }

    return response.json();
  }

  async advanceTime(days: number) {
    const response = await fetch(`${this.baseUrl}/simulate/time-advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days }),
    });

    if (!response.ok) {
      throw new Error('Failed to advance time');
    }

    return response.json();
  }

  async recomputeSegment(segmentId: string, triggerType = 'MANUAL_REFRESH') {
    const response = await fetch(
      `${this.baseUrl}/segments/${segmentId}/recompute-async?triggerType=${triggerType}`,
      {
        method: 'POST',
      },
    );

    if (!response.ok) {
      throw new Error('Failed to queue recompute');
    }

    return response.json();
  }
}
