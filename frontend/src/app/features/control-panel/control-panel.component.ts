import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, Customer, Segment } from '../../core/services/api.service';

@Component({
  selector: 'app-control-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './control-panel.component.html',
  styleUrls: ['./control-panel.component.scss'],
})
export class ControlPanelComponent implements OnInit {
  customers: Customer[] = [];
  segments: Segment[] = [];

  selectedCustomerId = '';
  selectedSegmentId = '';
  amount = 6000;
  daysToAdvance = 30;

  city = '';
  status = '';

  loadingCustomers = false;
  loadingSegments = false;
  actionLoading = false;

  message = '';
  error = '';

  constructor(private readonly apiService: ApiService) {}

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadCustomers(), this.loadSegments()]);
  }

  async loadCustomers(): Promise<void> {
    this.loadingCustomers = true;
    this.error = '';

    try {
      this.customers = await this.apiService.getCustomers();
      if (!this.selectedCustomerId && this.customers.length > 0) {
        this.selectedCustomerId = this.customers[0].id;
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load customers';
    } finally {
      this.loadingCustomers = false;
    }
  }

  async loadSegments(): Promise<void> {
    this.loadingSegments = true;
    this.error = '';

    try {
      this.segments = await this.apiService.getSegments();
      if (!this.selectedSegmentId && this.segments.length > 0) {
        this.selectedSegmentId = this.segments[0].id;
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load segments';
    } finally {
      this.loadingSegments = false;
    }
  }

  async addTransaction(): Promise<void> {
    if (!this.selectedCustomerId) return;

    this.startAction();

    try {
      const result = await this.apiService.addTransaction({
        customerId: this.selectedCustomerId,
        amount: this.amount,
      });

      this.message = `Transaction added. Impacted segments: ${result.impactedSegments?.join(', ') ?? 'n/a'}`;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to add transaction';
    } finally {
      this.endAction();
    }
  }

  async recomputeSelectedSegment(): Promise<void> {
    if (!this.selectedSegmentId) return;

    this.startAction();

    try {
      const result = await this.apiService.recomputeSegment(
        this.selectedSegmentId,
        'MANUAL_REFRESH',
      );

      this.message = `Recompute queued for segment: ${result.segmentName ?? result.segmentId}`;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to recompute segment';
    } finally {
      this.endAction();
    }
  }

  async advanceTime(): Promise<void> {
    this.startAction();

    try {
      const result = await this.apiService.advanceTime(this.daysToAdvance);
      this.message = `Time advanced by ${result.advancedByDays} day(s)`;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to advance time';
    } finally {
      this.endAction();
    }
  }

  async updateCustomerProfile(): Promise<void> {
    if (!this.selectedCustomerId) return;

    this.startAction();

    try {
      await this.apiService.updateProfile({
        customerId: this.selectedCustomerId,
        ...(this.city ? { city: this.city } : {}),
        ...(this.status ? { status: this.status } : {}),
      });

      this.message = 'Customer profile updated';
      await this.loadCustomers();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to update profile';
    } finally {
      this.endAction();
    }
  }

  getCustomerLabel(customer: Customer): string {
    return `${customer.name} (${customer.email})`;
  }

  getSegmentLabel(segment: Segment): string {
    return `${segment.name} [${segment.type}]`;
  }

  private startAction() {
    this.actionLoading = true;
    this.message = '';
    this.error = '';
  }

  private endAction() {
    this.actionLoading = false;
  }
}
