'use strict';

const TRANSPORT_WS = 'ws';
const TRANSPORT_HTTP = 'http';
const transport = {};

transport[TRANSPORT_WS] = (url) => (structure) => {
  const socket = new WebSocket(url);
  const api = {};
  const services = Object.keys(structure);

  for (const serviceName of services) {
    api[serviceName] = {};
    const service = structure[serviceName];
    const methods = Object.keys(service);

    for (const methodName of methods) {
      api[serviceName][methodName] = (...args) => new Promise((resolve) => {
        const packet = { name: serviceName, method: methodName, args };

        socket.send(JSON.stringify(packet));
        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          resolve(data);
        };
      });
    }
  }
  return new Promise((resolve) => {
    socket.addEventListener('open', () => resolve(api));
  });
}

transport[TRANSPORT_HTTP] = (url) => (structure) => {
  const api = {};
  const services = Object.keys(structure);

  for (const serviceName of services) {
    api[serviceName] = {};
    const service = structure[serviceName];
    const methods = Object.keys(service);

    for (const methodName of methods) {
      api[serviceName][methodName] = (...args) => {
        return new Promise((resolve, reject) => {
          fetch(`${url}/${serviceName}/${methodName}/${args.join('/')}`)
            .then((res) => {
              if (res.status === 200) resolve(res.json());
              else reject(new Error(`Status Code: ${status}`));
            });
        });
      }
    }
  }

  return Promise.resolve(api)
}

const scaffold = (url) => {
  const protocol = url.startsWith('ws:') ? TRANSPORT_WS : TRANSPORT_HTTP;
  return transport[protocol](url);
};

(async () => {
  const api = await scaffold('http://127.0.0.1:8001')({
    user: {
      create: ['record'],
      read: ['id'],
      update: ['id', 'record'],
      delete: ['id'],
      find: ['mask'],
    },
    country: {
      read: ['id'],
      delete: ['id'],
      find: ['mask'],
    },
  })

  const data = await api.user.read(3)
})()
