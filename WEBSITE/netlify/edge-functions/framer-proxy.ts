exports.handler = async (request) => {
  try {
    // Get complete request path with query parameters
    const incomingUrl = new URL(request.url);
    const fullPath = incomingUrl.pathname + incomingUrl.search;

    // Remove Netlify function path prefix (matches actual deployed path)
    const proxyPrefix = '/.netlify/functions/framer-proxy';
    const cleanPath = fullPath.startsWith(proxyPrefix)
      ? fullPath.slice(proxyPrefix.length)
      : fullPath;

    // Construct Framer URL with proper encoding
    const framerBase = 'https://charismatic-everyone-653587.framer.app';
    const framerUrl = new URL(cleanPath, framerBase);

    // Required headers to bypass Framer's security
    const headers = new Headers({
      'Host': framerBase.replace('https://', ''),
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Referer': framerBase,
      'Accept-Language': 'en-US,en;q=0.9'
    });

    // Proxy the request
    const response = await fetch(framerUrl, {
      headers,
      redirect: 'manual',
      method: request.method,
      body: request.body
    });

    // Handle redirects manually
    if ([301, 302, 307, 308].includes(response.status)) {
      return Response.redirect(new URL(response.headers.get('location'), framerBase), 302);
    }

    // Pass through non-HTML responses
    if (!response.headers.get('content-type')?.includes('text/html')) {
      return response;
    }

    // Modify HTML
    let html = await response.text();
    html = html
      .replace(/<title>[^<]*<\/title>/gi, '<title>Edoardo Graci - Product Designer</title>')
      .replace(/<meta property="og:title"[^>]*>/gi, '<meta property="og:title" content="Edoardo Graci - Product Designer"/>')
      .replace(/<meta name="description"[^>]*>/gi, '<meta name="description" content="Product designer with a focus on digital products and user experience."/>')
      .replace(/<meta name="robots"[^>]*>/gi, '')
      .replace(/<script [^>]*framer.com[^>]*><\/script>/gi, '');

    return new Response(html, {
      status: response.status,
      headers: {
        'Content-Type': 'text/html',
        'X-Robots-Tag': 'index, follow',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    return new Response(`Proxy error: ${error.message}`, { status: 500 });
  }
};
