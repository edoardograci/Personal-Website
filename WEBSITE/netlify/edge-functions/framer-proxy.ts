export default async (request) => {
  try {
    // Parse the incoming request URL
    const incomingUrl = new URL(request.url);
    const proxyPrefix = '/.netlify/edge-functions/framer-proxy';
    const cleanPath = incomingUrl.pathname.replace(proxyPrefix, '') || '/';
    const framerBase = 'https://charismatic-everyone-653587.framer.app';

    // Construct the Framer URL
    const framerUrl = new URL(cleanPath, framerBase);

    // Log incoming requests for debugging
    console.log(`Incoming request: ${incomingUrl.href}`);
    console.log(`Proxied to Framer: ${framerUrl.href}`);

    // Set headers to bypass Framer restrictions
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Referer': framerBase,
      'Accept-Language': 'en-US,en;q=0.9',
    };

    // Determine request method
    const method = request.method.toUpperCase();
    const supportsBody = ['POST', 'PUT', 'PATCH'].includes(method);

    // Fetch the response from Framer
    const response = await fetch(framerUrl, {
      headers,
      redirect: 'manual',
      method,
      body: supportsBody ? request.body : undefined,
    });

    // Handle redirects manually
    if ([301, 302, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      const cleanLocation = location ? location.replace(framerBase, '') : '';

      return new Response(null, {
        status: response.status,
        headers: {
          Location: cleanLocation,
        },
      });
    }

    // Ensure it's an HTML response before modification
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      let html = await response.text();

      // Modify the HTML
      html = html
        .replace(/<title>[^<]*<\/title>/gi, '<title>Edoardo Graci - Product Designer</title>')
        .replace(/<meta property="og:title"[^>]*>/gi, '<meta property="og:title" content="Edoardo Graci - Product Designer"/>')
        .replace(/<meta name="description"[^>]*>/gi, '<meta name="description" content="Product designer with a focus on digital products and user experience."/>')
        .replace(/<meta name="robots"[^>]*>/gi, '') // Remove the noindex tag
        .replace(new RegExp(framerBase, 'g'), '') // Replace all Framer base URLs with the clean URL
        .replace(/<script[^>]*src="https:\/\/events\.framer\.com\/script"[^>]*><\/script>/gi, ''); // Remove the problematic script

      return new Response(html, {
        status: response.status,
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',
          'X-Robots-Tag': 'index, follow',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Pass through non-HTML responses without modification
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(`Proxy error: ${error.message}`, {
      status: 500,
    });
  }
};
