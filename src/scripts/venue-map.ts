// Same venue coordinates as the existing directions links.
const venue: [number, number] = [37.6764, 126.7432];
const canvas = document.querySelector<HTMLElement>('[data-venue-map]');

async function showMap(element: HTMLElement) {
  const wrapper = element.closest<HTMLElement>('.live-map');
  const status = wrapper?.querySelector<HTMLElement>('[data-map-status]');
  if (!wrapper || !status) return;
  status.textContent = '지도를 불러오는 중입니다.';

  const unavailable = () => {
    clearTimeout(timeout);
    element.inert = true;
    element.setAttribute('aria-hidden', 'true');
    wrapper.dataset.mapState = 'error';
    status.hidden = false;
    status.textContent =
      '지도를 불러오지 못했습니다. 위 공식 약도와 길찾기 버튼을 이용하세요.';
  };
  const timeout = setTimeout(unavailable, 15000);

  try {
    const L = await import('leaflet');
    const map = L.map(element, {
      scrollWheelZoom: false,
      zoomControl: false,
      maxZoom: 19,
      minZoom: 10,
    }).setView(venue, 16);
    L.control
      .zoom({ zoomInTitle: '지도 확대', zoomOutTitle: '지도 축소' })
      .addTo(map);
    const tiles = L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      },
    );
    let loadedTiles = 0;
    tiles.on('tileload', () => {
      clearTimeout(timeout);
      loadedTiles += 1;
      element.inert = false;
      element.removeAttribute('aria-hidden');
      wrapper.dataset.mapState = 'ready';
      status.hidden = true;
    });
    tiles.on('load', () => {
      if (loadedTiles === 0) unavailable();
    });
    tiles.addTo(map);
    L.marker(venue, {
      title: '고양종합운동장',
      alt: '고양종합운동장 위치',
      icon: L.divIcon({
        className: 'venue-pin',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
    })
      .addTo(map)
      .bindTooltip('고양종합운동장', {
        permanent: true,
        direction: 'top',
        offset: [0, -18],
        className: 'venue-label',
      });
    new ResizeObserver(() => map.invalidateSize()).observe(element);
  } catch {
    unavailable();
  }
}

if (canvas) {
  // Load automatically when viewed, without prefetching off-screen map tiles.
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    void showMap(canvas);
  });
  observer.observe(canvas);
}
