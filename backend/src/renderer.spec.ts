import { renderDocument } from './modules/rendering/renderer/html-renderer.service';

describe('renderer', () => {
  it('renders QR and star-rating elements into a clipped canvas', async () => {
    const html = await renderDocument(
      [
        {
          type: 'qr-code',
          value: 'rendria',
          width: 80,
          height: 80,
          x: 0,
          y: 0,
        },
        {
          type: 'star-rating',
          rating: 3,
          maxRating: 5,
          width: 100,
          height: 20,
          x: 90,
          y: 0,
        },
      ],
      200,
      100,
      'https://example.test/placeholder.svg',
    );
    expect(html).toContain('id="canvas"');
    expect(html).toContain('<svg');
    expect(html).toContain('M12 17.27');
  });
});
