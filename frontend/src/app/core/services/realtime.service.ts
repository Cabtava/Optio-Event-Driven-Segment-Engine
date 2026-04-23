import { Inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

export type SegmentUpdatedEvent = {
  segmentId: string;
  segmentName: string;
  triggerType: string;
  previousVersion: number;
  nextVersion: number;
  oldCount: number;
  newCount: number;
  addedCount: number;
  removedCount: number;
  added: string[];
  removed: string[];
  hasChanges: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class RealtimeService {
  private socket?: Socket;
  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    private readonly ngZone: NgZone,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      this.socket = io('http://localhost:3000');

      this.socket.on('connect', () => {
        console.log('RealtimeService socket connected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('RealtimeService socket connect error:', error);
      });
    }
  }

  onSegmentUpdated(): Observable<SegmentUpdatedEvent> {
    return new Observable((observer) => {
      if (!this.isBrowser || !this.socket) {
        return;
      }

      this.socket.on('segment.updated', (data: SegmentUpdatedEvent) => {
        this.ngZone.run(() => {
          console.log('RealtimeService received segment.updated:', data);
          observer.next(data);
        });
      });

      return () => {
        this.socket?.off('segment.updated');
      };
    });
  }

  disconnect() {
    if (this.isBrowser) {
      this.socket?.disconnect();
    }
  }
}
