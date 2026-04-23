import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { RealtimeService, SegmentUpdatedEvent } from '../../core/services/realtime.service';

type UiSegmentUpdatedEvent = SegmentUpdatedEvent & {
  receivedAt: Date;
  expanded: boolean;
};

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity-feed.component.html',
  styleUrls: ['./activity-feed.component.scss'],
})
export class ActivityFeedComponent implements OnInit, OnDestroy {
  updates: UiSegmentUpdatedEvent[] = [];
  private subscription?: Subscription;

  constructor(
    private readonly realtimeService: RealtimeService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.subscription = this.realtimeService.onSegmentUpdated().subscribe((event) => {
      const enrichedEvent: UiSegmentUpdatedEvent = {
        ...event,
        receivedAt: new Date(),
        expanded: false,
      };

      this.updates = [enrichedEvent, ...this.updates].slice(0, 20);
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  toggleExpanded(index: number): void {
    this.updates[index].expanded = !this.updates[index].expanded;
  }

  getTriggerLabel(triggerType: string): string {
    switch (triggerType) {
      case 'MANUAL_REFRESH':
        return 'Manual Refresh';
      case 'TRANSACTION':
        return 'Transaction';
      case 'PROFILE_UPDATE':
        return 'Profile Update';
      case 'TIME_ADVANCE':
        return 'Time Advance';
      case 'DEPENDENCY_CHANGE':
        return 'Dependency Change';
      case 'INITIAL_SEED':
        return 'Initial Seed';
      default:
        return triggerType;
    }
  }

  hasNoChanges(update: SegmentUpdatedEvent): boolean {
    return update.addedCount === 0 && update.removedCount === 0;
  }
}