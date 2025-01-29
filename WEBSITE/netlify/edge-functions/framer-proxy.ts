export const handler = async (event) => {
  try {
    const incomingUrl = new URL(event.rawUrl);
    const framerBase = 'https://charismatic-everyone-653587.framer.app';

    // Sanitize the path (ensure no double slashes)
    let cleanPath = incomingUrl.pathname;
    cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    cleanPath = cleanPath.replace(/\/+/g, '/'); // Remove double slashes

    const framerUrl = new URL(cleanPath, framerBase);

    console.log(`Proxying: ${incomingUrl.href} → ${framerUrl.href}`);

    // Configure headers to mimic a browser
    const headers = new Headers({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Referer': framerBase,
      'Accept-Language': 'en-US,en;q=0.9',
    });

    // Fetch from Framer
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
      return { statusCode: response.status, headers: { Location: cleanLocation }, body: '' };
    }

    // Process HTML responses
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      let html = await response.text();
      html = html
        .replace(/<title>[^<]*<\/title>/gi, '<title>Edoardo Graci - Product Designer</title>')
        .replace(/<meta property="og:title"[^>]*>/gi, '<meta property="og:title" content="Edoardo Graci - Product Designer"/>')
        .replace(/<meta name="description"[^>]*>/gi, '<meta name="description" content="Product designer with a focus on digital products and user experience."/>')
        .replace(/<meta name="robots"[^>]*>/gi, '')  // Remove the noindex tag
        .replace(new RegExp(framerBase, 'g'), '')  // Replace all Framer base URLs with the clean URL
        .replace(/<script[^>]*src="https:\/\/events\.framer\.com\/script"[^>]*><\/script>/gi, '');  // Remove the problematic script

      return {
        statusCode: response.status,
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',
          'X-Robots-Tag': 'index, follow',
          'Cache-Control': 'public, max-age=300',  // Reduced to 5 minutes
        },
        body: html,
      };
    }

    // Handle binary data (images, fonts, etc.)
    const buffer = await response.arrayBuffer();
    return {
      statusCode: response.status,
      headers: Object.fromEntries(response.headers),
      body: Buffer.from(buffer).toString('base64'),
      isBase64Encoded: true,  // Critical for non-text content
    };

  } catch (error) {
    console.error('Proxy error:', error);
    return { statusCode: 500, body: `Proxy error: ${error.message}` };
  }
};
