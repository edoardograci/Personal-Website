export default async function handler(event) {
  try {
    // Construct the incoming URL
    const host = event.headers.get('host') || 'edoardograci.com';
    const protocol = event.headers.get('x-forwarded-proto') || 'https';
    const incomingUrl = new URL(event.url, `${protocol}://${host}`);
    const framerBase = 'https://charismatic-everyone-653587.framer.app';

    // Determine the path to proxy
    let cleanPath = incomingUrl.pathname;
    if (cleanPath === '/.netlify/edge-functions/framer-proxy') {
      return new Response('Not Found', { status: 404 });
    }

    // Clean up the path
    cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    cleanPath = cleanPath.replace(/\/+/g, '/');

    // Build the Framer URL
    const framerUrl = new URL(cleanPath, framerBase);
    framerUrl.search = incomingUrl.search;

    // Set up request headers
    const headers = new Headers({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Referer': framerBase,
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': '*/*',
      'Connection': 'keep-alive',
    });

    // Forward headers from the original request
    for (const [key, value] of event.headers.entries()) {
      if (!['host', 'referer', 'user-agent'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    }

    // Make the request to the Framer site
    const response = await fetch(framerUrl.toString(), {
      headers,
      method: event.method,
      redirect: 'manual',
      body: ['POST', 'PUT', 'PATCH'].includes(event.method) ? event.body : undefined,
    });

    // Handle redirects
    if ([301, 302, 307, 308].includes(response.status)) {
      const location = response.headers.get('location') || '';
      const cleanLocation = location.replace(framerBase, '');
      return new Response(null, {
        status: response.status,
        headers: { Location: cleanLocation },
      });
    }

    // Process the response
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      let html = await response.text();

      // Modify the HTML as needed
      html = html
        .replace(/<title>[^<]*<\/title>/gi, '<title>Edoardo Graci - Product Designer</title>')
        .replace(/<meta\s+name=["']description["'][^>]*>/gi, '<meta name="description" content="Product designer with a focus on digital products and user experience."/>')
        .replace(/<meta\s+property=["']og:title["'][^>]*>/gi, '<meta property="og:title" content="Edoardo Graci - Product Designer"/>')
        .replace(/<meta\s+name=["']robots["'][^>]*>/gi, '<meta name="robots" content="index, follow"/>')
        .replace(new RegExp(framerBase, 'g'), '')
        .replace(/<script[^>]*src=["']https:\/\/events\.framer\.com\/script["'][^>]*><\/script>/gi, '');

      // Add robots meta tag if missing
      if (!html.includes('name="robots"')) {
        html = html.replace('</head>', '<meta name="robots" content="index, follow">\n</head>');
      }

      // Return the modified HTML
      return new Response(html, {
        status: response.status,
        headers: new Headers({
          'Content-Type': 'text/html; charset=UTF-8',
          'X-Robots-Tag': 'index, follow',
          'Cache-Control': 'public, max-age=300',
        }),
      });
    }

    // Return non-HTML responses as-is
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(`Proxy error: ${error.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
