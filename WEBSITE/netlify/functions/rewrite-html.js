exports.handler = async (event, context) => {
  try {
    // Decode path to handle special characters
    const path = decodeURI(event.path);
    // Ensure root path ("/") is correctly handled
    const framerPath = path === "/.netlify/functions/rewrite-html" ? "/" : path;
    const framerUrl = `https://charismatic-everyone-653587.framer.app${framerPath}`;

    // Forward headers to mimic a real browser request
    const headers = {
      'User-Agent': event.headers['user-agent'] || 'Mozilla/5.0 (compatible; Netlify)',
      'Accept': event.headers['accept'] || 'text/html',
    };

    const response = await fetch(framerUrl, { headers });

    // Handle Framer 404s by redirecting to Netlify's 404.html
    if (response.status === 404) {
      return { statusCode: 404, body: 'Not Found' };
    }

    let html = await response.text();

    // Remove noindex meta tag and Framer analytics
    html = html
      .replace(/<meta\s+name=["']robots["']\s+content=["']noindex["']\s*\/?>/gi, "")
      .replace(/<script\s+async\s+src="https:\/\/events\.framer\.com\/script".*?<\/script>/gi, "");

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: html,
    };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, body: "Internal Server Error" };
  }
};
