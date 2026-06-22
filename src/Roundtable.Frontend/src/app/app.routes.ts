import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./home/home.component').then(m => m.HomeComponent) },
  {
    path: 'demo-settings',
    loadComponent: () => import('./demo-settings/demo-settings.component').then(m => m.DemoSettingsComponent),
  },
  { path: 'team/:teamId', loadComponent: () => import('./team/team.component').then(m => m.TeamComponent) },
  { path: 'team/:teamId/settings', loadComponent: () => import('./team-users/team-users.component').then(m => m.TeamUsersComponent) },
  { path: '**', redirectTo: '' },
];
