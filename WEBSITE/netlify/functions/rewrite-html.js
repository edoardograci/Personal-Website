export default async (req, res) => {
  try {
    // Fetch the HTML from the Framer app
    const response = await fetch("https://charismatic-everyone-653587.framer.app/");
    let html = await response.text();

    // Remove the noindex meta tag
    html = html.replace(/<meta name="robots" content="noindex">/g, "");

    // Set headers to allow indexing
    res.setHeader("X-Robots-Tag", "index, follow");
    res.setHeader("Content-Type", "text/html");

    // Return the modified HTML
    res.status(200).send(html);
  } catch (error) {
    res.status(500).send("Error fetching or modifying HTML");
  }
};