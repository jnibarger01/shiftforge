/** OpenStreetMap's public embed — a real map with no API key or extra dependency. */
export function osmEmbed(lat?: number, lng?: number, zoomSpan = 0.06) {
  if (lat === undefined || lng === undefined) return 'https://www.openstreetmap.org/export/embed.html?bbox=-125.0%2C24.5%2C-66.9%2C49.4&layer=mapnik';
  const bbox = [lng - zoomSpan, lat - zoomSpan * 0.6, lng + zoomSpan, lat + zoomSpan * 0.6].map((n) => n.toFixed(4)).join('%2C');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(5)}%2C${lng.toFixed(5)}`;
}

export const osmLink = (lat: number, lng: number) => `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=14/${lat}/${lng}`;
