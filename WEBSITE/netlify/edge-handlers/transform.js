// netlify/edge-handlers/transform.js
export default async function transform(request, context) {
  const response = await context.next();
  
  // Only transform HTML responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('text/html')) {
    return response;
  }

  const text = await response.text();
  const modified = text
    .replace(/<title>[^<]*<\/title>/gi, '<title>Edoardo Graci - Product Designer</title>')
    .replace(/<meta property="og:title"[^>]*>/gi, '<meta property="og:title" content="Edoardo Graci - Product Designer"/>')
    .replace(/<meta name="description"[^>]*>/gi, '<meta name="description" content="Product designer with a focus on digital products and user experience."/>')
    .replace('</body>', `
      <script>
        document.addEventListener('DOMContentLoaded', function () {
          const meta = document.querySelector('meta[name="robots"]');
          if (meta) meta.remove();

          const observer = new MutationObserver(() => {
            const injectedMeta = document.querySelector('meta[name="robots"]');
            if (injectedMeta) injectedMeta.remove();
          });

          observer.observe(document.head, { childList: true, subtree: true });
        });
      </script>
    </body>`);

  return new Response(modified, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      'x-robots-tag': 'index, follow',
      'cache-control': 'public, max-age=3600'
    }
  });
}
