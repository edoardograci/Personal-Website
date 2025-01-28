export const handler = async (event) => {
  try {
    // Parse the incoming request URL
    const incomingUrl = new URL(event.rawUrl);
    const proxyPrefix = '/.netlify/functions/framer-proxy';
    const cleanPath = incomingUrl.pathname.replace(proxyPrefix, '') || '/';
    const framerBase = 'https://charismatic-everyone-653587.framer.app';

    // Construct the Framer URL
    const framerUrl = new URL(cleanPath, framerBase);

    // Log the incoming and proxied requests
    console.log(`Incoming request: ${incomingUrl.href}`);
    console.log(`Proxied to Framer: ${framerUrl.href}`);

    // Set headers to bypass Framer restrictions
    const headers = new Headers({
      'Host': framerBase.replace('https://', ''),
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Referer': framerBase,
      'Accept-Language': 'en-US,en;q=0.9',
    });

    // Forward the request to Framer
    const response = await fetch(framerUrl, {
      headers,
      redirect: 'manual',
      method: event.httpMethod,
      body: event.body,
    });

    // Handle redirects manually
    if ([301, 302, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      const redirectedUrl = new URL(location, framerBase);
      console.log(`Redirecting to: ${redirectedUrl.href}`);
      return {
        statusCode: 302,
        headers: { Location: redirectedUrl.href },
        body: '',
      };
    }

    // Handle HTML responses
    if (response.headers.get('content-type')?.includes('text/html')) {
      let html = await response.text();

      // Replace metadata dynamically
      html = html
        .replace(/<title>[^<]*<\/title>/gi, '<title>Edoardo Graci - Product Designer</title>')
        .replace(/<meta property="og:title"[^>]*>/gi, '<meta property="og:title" content="Edoardo Graci - Product Designer"/>')
        .replace(/<meta name="description"[^>]*>/gi, '<meta name="description" content="Product designer with a focus on digital products and user experience."/>')
        .replace(/<meta name="robots"[^>]*>/gi, '')
        .replace(/<script [^>]*framer.com[^>]*><\/script>/gi, '');

      return {
        statusCode: response.status,
        headers: {
          'Content-Type': 'text/html',
          'X-Robots-Tag': 'index, follow',
          'Cache-Control': 'public, max-age=3600',
        },
        body: html,
      };
    }

    // Return non-HTML responses as is
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
