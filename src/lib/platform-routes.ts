export const platformRoutes={early:'/radar-timpuriu',overview:'/dashboard',universe:'/companii',companies:'/verificate',discoveries:'/descoperiri',startups:'/startupuri',dossiers:'/dosare',calendar:'/calendar',watchlist:'/lista-mea',research:'/cercetare',alerts:'/notificari',settings:'/preferinte'} as const;
export type View=keyof typeof platformRoutes;
