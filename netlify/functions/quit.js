// Netlify function to handle quit requests
// In production, this just returns a success message since there's no server to quit
exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ 
      status: 'quit_acknowledged',
      message: 'This is a static site - no server to quit!'
    })
  };
};