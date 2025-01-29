// netlify/edge-functions/framer-proxy.ts
export const handler = async (event) => {
  try {
    const incomingUrl = new URL(event.rawUrl);
    const framerBase = 'https://charismatic-everyone-653587.framer.app';
    
    // Skip proxying for static assets and direct them to your dist folder
    if (incomingUrl.pathname.startsWith('/static/')) {
      return Response.redirect(`/dist${incomingUrl.pathname}`, 301);
    }

    // Sanitize the path
    let cleanPath = incomingUrl.pathname;
    cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    cleanPath = cleanPath.replace(/\/+/g, '/');
    const framerUrl = new URL(cleanPath, framerBase);

    // Forward query parameters
    framerUrl.search = incomingUrl.search;
    
    console.log(`Proxying: ${incomingUrl.href} → ${framerUrl.href}`);

    const headers = new Headers({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Referer': framerBase,
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': '*/*',
      'Connection': 'keep-alive',
    });

    // Forward original request headers
    for (const [key, value] of Object.entries(event.headers)) {
      if (!['host', 'referer', 'user-agent'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    }

    const method = event.httpMethod.toUpperCase();
    const response = await fetch(framerUrl, {
      headers,
      method,
      redirect: 'manual',
      body: ['POST', 'PUT', 'PATCH'].includes(method) ? event.body : undefined,
    });

    // Handle redirects
    if ([301, 302, 307, 308].includes(response.status)) {
      const location = response.headers.get('location') || '';
      const cleanLocation = location.replace(framerBase, '');
      return new Response(null, {
        status: response.status,
        headers: { 'Location': cleanLocation }
      });
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      let html = await response.text();
      html = html
        .replace(/<title>[^<]*<\/title>/gi, '<title>Edoardo Graci - Product Designer</title>')
        .replace(/<meta property="og:title"[^>]*>/gi, '<meta property="og:title" content="Edoardo Graci - Product Designer"/>')
        .replace(/<meta name="description"[^>]*>/gi, '<meta name="description" content="Product designer with a focus on digital products and user experience."/>')
        .replace(/<meta name="robots"[^>]*>/gi, '<meta name="robots" content="index, follow"/>')
        .replace(new RegExp(framerBase, 'g'), '')
        .replace(/<script[^>]*src="https:\/\/events\.framer\.com\/script"[^>]*><\/script>/gi, '');

      const responseHeaders = new Headers({
        'Content-Type': 'text/html; charset=UTF-8',
        'X-Robots-Tag': 'index, follow',
        'Cache-Control': 'public, max-age=300',
      });

      return new Response(html, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    // For non-HTML responses, forward as-is
    const responseInit = {
      status: response.status,
      headers: response.headers,
    };

    return new Response(response.body, responseInit);
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(`Proxy error: ${error.message}`, { status: 500 });
  }
};
