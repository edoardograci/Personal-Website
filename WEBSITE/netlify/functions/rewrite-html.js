exports.handler = async (event, context) => {
  try {
    // Extract the original path (e.g., "/contact" → "/contact")
    const path = event.path.replace(/^\/\.netlify\/functions\/rewrite-html/, '') || '/';
    const decodedPath = decodeURI(path);
    const framerUrl = `https://charismatic-everyone-653587.framer.app${decodedPath}`;

    // Mimic a browser request to bypass Framer's bot blocking
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Accept': 'text/html',
    };

    const response = await fetch(framerUrl, { headers });

    // Handle Framer 404s
    if (response.status === 404) {
      return { statusCode: 404, body: 'Page not found' };
    }

    let html = await response.text();

    // Remove Framer's noindex meta tag and analytics
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
