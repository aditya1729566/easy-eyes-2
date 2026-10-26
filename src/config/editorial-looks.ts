/** Editorial looks supplied for the homepage. Add frameImage when matching product photography arrives. */
export type EditorialLook = { image: string; alt: string; frameImage?: string };
export const editorialLooks: EditorialLook[] = [
  { image: '/assets/models/cutout/look-01.png', alt: 'Blonde model in a lilac dress wearing slim tinted metal frames' },
  { image: '/assets/models/cutout/look-02.png', alt: 'Blonde model in a blush dress wearing black oval sunglasses' },
  { image: '/assets/models/cutout/look-03.png', alt: 'Dark-haired model in black wearing delicate gold rimless frames' },
  { image: '/assets/models/cutout/look-04.png', alt: 'Short-haired model in a leather jacket wearing narrow tinted frames' },
  { image: '/assets/models/cutout/look-05.png', alt: 'Model in a navy knit wearing compact black optical frames' },
  { image: '/assets/models/cutout/look-10.png', alt: 'Short-haired model in an ivory shirt wearing clear rectangular frames' },
  { image: '/assets/models/cutout/look-06.png', alt: 'Red-haired model in a sheer ivory top wearing slim tinted metal frames' },
  { image: '/assets/models/cutout/look-07.png', alt: 'Short-haired model in a dark one-shoulder look wearing angular black frames' },
  { image: '/assets/models/cutout/look-08.png', alt: 'Blonde model in an ivory top wearing narrow silver optical frames' },
  { image: '/assets/models/cutout/look-09.png', alt: 'Model with braids in a black sequined jacket wearing silver rimless frames' },
];

export const editorialPriceMinor = 2_500_000;
export const filmSources = [
  { desktop: '/assets/campaign/film-01.mp4', mobile: '/assets/campaign/film-01-mobile.mp4' },
  { desktop: '/assets/campaign/film-02.mp4', mobile: '/assets/campaign/film-02-mobile.mp4' },
  { desktop: '/assets/campaign/film-03.mp4', mobile: '/assets/campaign/film-03-mobile.mp4' },
  { desktop: '/assets/campaign/film-04.mp4', mobile: '/assets/campaign/film-04-mobile.mp4' },
] as const;
