const http = require('http');
const fs = require('fs');
const query = require('querystring');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../client/client.html`);
const css = fs.readFileSync(`${__dirname}/../client/style.css`);

// data that will update and grow as user makes inputs
const users = {};

// Writes the response for specific requests
const respond = (request, response, status, type, content) => {
  response.writeHead(status, { 'Content-Type': type });

  if (request.method !== 'HEAD') {
    response.write(content);
  }

  response.end();
};

const respondJSON = (request, response, status, object) => {
    respond(request, response, status, 'application/json', JSON.stringify(object));
};

const getIndex = (request, response) => {
  respond(request, response, 200, 'text/html', index);
};

const getCSS = (request, response) => {
  respond(request, response, 200, 'text/css', css);
};

const getUsers = (request, response) => {
  respondJSON(request, response, 200, { users });
};

const notFound = (request, response) => {
  respondJSON(request, response, 404, {
    message: 'The page you are looking for was not found.',
    id: 'notFound',
  });
};

// updates the users data as needed
const addUser = (request, response) => {
  const body = [];

  request.on('data', (chunk) => {
    body.push(chunk);
  });

  request.on('end', () => {
    const bodyString = Buffer.concat(body).toString();
    const bodyParams = query.parse(bodyString);

    const { name, age } = bodyParams;

    if (!name || !age) {
      return respondJSON(request, response, 400, {
        message: 'Name and age are both required.',
        id: 'missingParams',
      });
    }

    if (users[name]) {
      users[name].age = age;
      response.writeHead(204);
      return response.end();
    }

    users[name] = { name, age };

    return respondJSON(request, response, 201, {
      message: 'Created Successfully',
    });
  });
};

// handles requests
const onRequest = (request, response) => {
  const parsedUrl = new URL(request.url, 'http://${request.headers.host}');
  const path = parsedUrl.pathname;

  // handles POST
  if (request.method === 'POST') {
    if (path === '/addUser') {
      return addUser(request, response);
    }
    return notFound(request, response);
  }

  // handles GET and HEAD
  switch (path) {
    case '/':
      return getIndex(request, response);
    case '/style.css':
      return getCSS(request, response);
    case '/getUsers':
      return getUsers(request, response);
    default:
      return notFound(request, response);
  }
};

http.createServer(onRequest).listen(port, () => {
  console.log(`Listening on 127.0.0.1: ${port}`);
});