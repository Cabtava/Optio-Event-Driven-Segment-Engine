import { Component } from '@angular/core';
import { ActivityFeedComponent } from './features/activity-feed/activity-feed.component';
import { ControlPanelComponent } from './features/control-panel/control-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ControlPanelComponent, ActivityFeedComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
