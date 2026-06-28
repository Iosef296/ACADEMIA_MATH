import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { LiveListComponent } from './live-list/live-list.component';
import { LiveRoomComponent } from './live-room/live-room.component';

const routes: Routes = [
  { path: '', component: LiveListComponent },
  { path: ':id', component: LiveRoomComponent },
];

@NgModule({
  declarations: [LiveListComponent, LiveRoomComponent],
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class LiveModule {}
