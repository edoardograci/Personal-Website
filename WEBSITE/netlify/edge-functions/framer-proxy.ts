export const handler = async (event) => {
  try {
    // Parse the incoming request URL
    const incomingUrl = new URL(event.rawUrl);
    const proxyPrefix = '/.netlify/functions/framer-proxy';
    let cleanPath = incomingUrl.pathname.replace(proxyPrefix, '') || '/';
    const framerBase = 'https://charismatic-everyone-653587.framer.app';

    // 🚀 FIX: Ensure cleanPath does not retain proxy prefix
    console.log(`🚀 Before Cleaning Path: ${incomingUrl.pathname}`);
    console.log(`✅ Cleaned Path: ${cleanPath}`);

    // Construct the Framer URL
    const framerUrl = new URL(cleanPath, framerBase);

    // Log incoming requests for debugging
    console.log(`Incoming request: ${incomingUrl.href}`);
    console.log(`Proxied to Framer: ${framerUrl.href}`);

    // Set headers to bypass Framer restrictions
    const headers = new Headers({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Referer': framerBase,
      'Origin': framerBase, 
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
      console.log(`🔄 Redirected Location Before Cleaning: ${location}`);

      // 🚀 FIX: Ensure redirects also remove proxy prefix
      let cleanLocation = location ? location.replace(framerBase, '') : '';
      cleanLocation = cleanLocation.replace(proxyPrefix, ''); // Ensure proxy path is removed

      console.log(`✅ Clean Redirect Location: ${cleanLocation}`);

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

      // 🚀 FIX: Ensure all instances of framerBase + proxy path are removed
      html = html
        .replace(/<title>[^<]*<\/title>/gi, '<title>Edoardo Graci - Product Designer</title>')
        .replace(/<meta property="og:title"[^>]*>/gi, '<meta property="og:title" content="Edoardo Graci - Product Designer"/>')
        .replace(/<meta name="description"[^>]*>/gi, '<meta name="description" content="Product designer with a focus on digital products and user experience."/>')
        .replace(/<meta name="robots"[^>]*>/gi, '') // Remove noindex tag
        .replace(new RegExp(framerBase + proxyPrefix, 'g'), '/') // Remove proxy path from Framer URLs
        .replace(new RegExp(framerBase, 'g'), '/') // Ensure all Framer URLs are converted to clean paths
        .replace(/<script[^>]*src="https:\/\/events\.framer\.com\/script"[^>]*><\/script>/gi, ''); // Remove unwanted scripts

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
    console.error('❌ Proxy error:', error);
    return {
      statusCode: 500,
      body: `Proxy error: ${error.message}`,
    };
  }
};

