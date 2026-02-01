import type { RoutesWhitelistOptions, AllowedRoute } from '../../types/types';
import Logger from '../loggers/loggerService.js';

export function initRoutesWhitelist({ app, admittedRoutes = [] }: RoutesWhitelistOptions) {
    // Routes whitelist
    const allowedRoutes = admittedRoutes.reduce<AllowedRoute[]>((acc, area) => {
        const rootPath = area.path !== '/' ? area.path : '';
        const rts = area.route.routes.reduce<AllowedRoute[]>((acc2, route) => {
            // Express 5 does not work correctly with the '*' route, so we have to do it this way.
            // If this is fixed in the future, remove this workaround.
            const childPath = route.path instanceof RegExp ? '*' : route.path;

            if (childPath !== '*') {
                const computedPath = rootPath + childPath.replace(/\/+$/, '') || '/';
                acc2.push({ path: computedPath, method: route.method });
            }
            return acc2;
        }, []);
        return acc.concat(rts);
    }, []);

    // Routes whitelist redirection
    app.use((req, res, next) => {
        const isRouteAllowed = allowedRoutes.some((route) => {
            if (route.path === '/') {
                return req.path === route.path && route.method === req.method.toLowerCase();
            }
            return req.path.startsWith(route.path) && route.method === req.method.toLowerCase();
        });

        if (!isRouteAllowed) {
            Logger.warn({
                message: `Whitelist redirection. ip: ${req.ip}, method: ${req.method}, path: ${req.originalUrl}`,
                source: 'routesWhitelist',
            });
            if (req.method.toLowerCase() === 'get') {
                res.redirect('/info?code=404&msg=not_found_404');
            } else {
                res.status(404).json({ error: 'Not Found' });
            }
        } else {
            next();
        }
    });
}
