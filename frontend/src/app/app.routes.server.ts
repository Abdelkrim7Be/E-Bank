import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'users/:id/edit',
    renderMode: RenderMode.Server,
  },
  {
    path: 'users/:id/view',
    renderMode: RenderMode.Server,
  },
  {
    path: 'customers/:id/edit',
    renderMode: RenderMode.Server,
  },
  {
    path: 'customers/:id/view',
    renderMode: RenderMode.Server,
  },

  {
    path: 'users',
    renderMode: RenderMode.Server,
  },
  {
    path: 'products',
    renderMode: RenderMode.Server,
  },
  {
    path: 'customers',
    renderMode: RenderMode.Server,
  },

  {
    path: '',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'dashboard',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'users/new',
    renderMode: RenderMode.Server,
  },
  {
    path: 'customers/new',
    renderMode: RenderMode.Server,
  },

  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
