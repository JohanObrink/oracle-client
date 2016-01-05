# oracle-client
An oracledb client for connecting to oracledb directly, serving the connection through a web socket or consuming said web socket.

## Usage

### As direct client

Follow install instructions at
https://github.com/oracle/node-oracledb/blob/master/INSTALL.md

```bash
npm install --save oracle-client oracledb
```

```javascript
var client = require('oracle-client').direct();
```

### As web socket server

Follow install instructions at
https://github.com/oracle/node-oracledb/blob/master/INSTALL.md

```bash
npm install --save oracle-client oracledb socket.io
```

```javascript
// default port (80)
var client = require('oracle-client').serve();

// select port
var client = require('oracle-client').serve(3000);

// https with certs
var options = {
  key: fs.readFileSync('test/fixtures/keys/agent2-key.pem'),
  cert: fs.readFileSync('test/fixtures/keys/agent2-cert.pem')
};
var secureClient = require('oracle-client').serve(443, options);
```

#### HTML client

With the web socket server, you may also use the HTML interface to connect to
and query the database. Just open the address you chose to expose in the browser.

```javascript
require('oracle-client').serve(3000);
```

Open http://localhost:3000

### As web socket server consumer

Follow install instructions at
https://github.com/oracle/node-oracledb/blob/master/INSTALL.md

```bash
npm install --save oracle-client socket.io-client
```

```javascript
var client = require('oracle-client').connect('http://localhost:3000');
```

### Common

```javascript
var config = {
  user: 'db-username',
  password: 'db-password',
  host: 'mydbserver.com',
  database: 'MY_DATABASE'
};

client
  .connect(config)
  .then(connection => {
    return connection
      .execute('SELECT * FROM USERS WHERE EMAIL = :email', ['johan.obrink@gmail.com'])
      .then(result => {
        return connection
          .close()
          .then(() => result);
      })
      .catch(err => {
        return connection
          .close()
          .then(() => Promise.reject(err));
      });
  });
```

## License

The MIT License (MIT)

Copyright (c) 2016 Johan Öbrink

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
