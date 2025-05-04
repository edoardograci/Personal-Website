export const handler = async (event) => {
  try {
    // Parse the incoming request URL
    const incomingUrl = new URL(event.rawUrl);
    const proxyPrefix = '/.netlify/functions/framer-proxy';
    const framerBase = 'https://charismatic-everyone-653587.framer.app';

    // Ensure the path does not include the proxy prefix
    const cleanPath = incomingUrl.pathname.startsWith(proxyPrefix)
      ? incomingUrl.pathname.replace(proxyPrefix, '') || '/'
      : incomingUrl.pathname;

    // Construct the Framer URL
    const framerUrl = new URL(cleanPath, framerBase);

    // Log incoming requests for debugging
    console.log(`Incoming request: ${incomingUrl.href}`);
    console.log(`Proxied to Framer: ${framerUrl.href}`);

    // Set headers to bypass Framer restrictions
    const headers = new Headers({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Referer': framerBase,
      'Accept-Language': 'en-US,en;q=0.9',
    });

    // Determine request method
    const method = event.httpMethod.toUpperCase();
    const supportsBody = ['POST', 'PUT', 'PATCH'].includes(method);

    // Fetch the response from Framer
    const response = await fetch(framerUrl, {
      headers,
      redirect: 'manual',
      method,
      body: supportsBody ? event.body : undefined,
    });

    // Handle redirects manually
    if ([301, 302, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      const cleanLocation = location ? location.replace(framerBase, '/') : '/';

      return {
        statusCode: response.status,
        headers: {
          Location: cleanLocation,
        },
        body: '',
      };
    }

    // Ensure it's an HTML response before modification
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      let html = await response.text();

      // Modify the HTML
      html = html
        .replace(/<title>[^<]*<\/title>/gi, '<title>Edoardo Graci - Industrial Designer</title>')
        .replace(/<meta property="og:title"[^>]*>/gi, '<meta property="og:title" content="Edoardo Graci - Industrial Designer"/>')
        .replace(/<meta name="description"[^>]*>/gi, '<meta name="description" content="Edoardo Graci Studio is a creative studio based in Milan, Italy, founded in 2025. The studio serves as an archive of products that reflect his evolution as an industrial designer over the years."/>')
        .replace(/<meta\s+name=["']robots["']\s+content=["'][^"']*["']\s*\/?>/gi, '') // Remove robots meta tag
        .replace(new RegExp(framerBase, 'g'), '/') // Replace all Framer base URLs with the clean URL
        .replace(/<script[^>]*src="https:\/\/events\.framer\.com\/script"[^>]*><\/script>/gi, ''); // Remove the problematic script

      // Inject MutationObserver and analytics script
      html = html.replace('</body>', `
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
        <!-- 100% privacy-first analytics -->
        <script async src="https://scripts.simpleanalyticscdn.com/latest.js"></script>
      </body>`);

      return {
        statusCode: response.status,
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',
          'X-Robots-Tag': 'index, follow',
          'Cache-Control': 'public, max-age=3600',
        },
        body: html,
      };
    }

    // Pass through non-HTML responses without modification
    return {
      statusCode: response.status,
      headers: Object.fromEntries(response.headers),
      body: await response.text(),
    };
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      body: `Proxy error: ${error.message}`,
    };
  }
};
