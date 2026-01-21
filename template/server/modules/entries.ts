import type { RouteGroup, RouterType } from '../core/types/types.js';

import mainRoutes from './main/routes.js';

// mainRoutes with root routes must always be at the last position
export const usingRoutes: RouteGroup[] = [
    {
        path: '/',
        route: mainRoutes as RouterType,
    },
];
