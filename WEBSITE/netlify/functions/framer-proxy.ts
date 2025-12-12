export const handler = async (event) => {
  try {
    const incomingUrl = new URL(event.rawUrl);
    const proxyPrefix = '/.netlify/functions/framer-proxy';
    const framerBase = 'https://charismatic-everyone-653587.framer.app';

    const cleanPath = incomingUrl.pathname.startsWith(proxyPrefix)
      ? incomingUrl.pathname.replace(proxyPrefix, '') || '/'
      : incomingUrl.pathname;

    const framerUrl = new URL(cleanPath, framerBase);

    console.log(`Incoming request: ${incomingUrl.href}`);
    console.log(`Proxied to Framer: ${framerUrl.href}`);

    const headers = new Headers({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Referer': framerBase,
      'Accept-Language': 'en-US,en;q=0.9',
    });

    const method = event.httpMethod.toUpperCase();
    const supportsBody = ['POST', 'PUT', 'PATCH'].includes(method);

    const response = await fetch(framerUrl, {
      headers,
      redirect: 'manual',
      method,
      body: supportsBody ? event.body : undefined,
    });

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

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      let html = await response.text();

      // Replace metadata and remove robots meta
      html = html
        .replace(/<title>[^<]*<\/title>/gi, '<title>Edoardo Graci - Industrial Designer</title>')
        .replace(/<meta property="og:title"[^>]*>/gi, '<meta property="og:title" content="Edoardo Graci - Industrial Designer"/>')
        .replace(/<meta name="description"[^>]*>/gi, '<meta name="description" content="Edoardo Graci Studio is a creative studio based in Milan, Italy, founded in 2025. The studio serves as an archive of products that reflect his evolution as an industrial designer over the years."/>')
        .replace(/<meta\s+name=["']robots["']\s+content=["'][^"']*["']\s*\/?>/gi, '')
        .replace(new RegExp(framerBase, 'g'), '/')
        .replace(/<script[^>]*src="https:\/\/events\.framer\.com\/script"[^>]*><\/script>/gi, '');

      // Inject Google Tag Manager in head
      html = html.replace(
        /<\/head>/i,
        `
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-WWBHC945');</script>
<!-- End Google Tag Manager -->
</head>`
      );

      // Inject GTM noscript + MutationObserver + SimpleAnalytics before closing body
      html = html.replace(
        /<body[^>]*>/i,
        match => `${match}
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WWBHC945" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
`
      );

      html = html.replace(
        '</body>',
        `
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

<script data-collect-dnt="true" async src="https://scripts.simpleanalyticscdn.com/latest.js"></script>
<noscript><img src="https://queue.simpleanalyticscdn.com/noscript.gif?collect-dnt=true" alt="" referrerpolicy="no-referrer-when-downgrade"/></noscript>
</body>`
      );

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
