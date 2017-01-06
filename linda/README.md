Node Linda
==========
<a href="http://en.wikipedia.org/wiki/Linda_(coordination_language)">Coordinatioin Launguage "Linda"</a> implementation for Node.js and Socket.IO

- https://github.com/node-linda/linda
- https://npmjs.org/package/linda
- [Web版Lindaによる実世界コンピューティング](http://www.slideshare.net/shokai/prosym-node-linda)

[![Travis CI Status Badge](https://travis-ci.org/node-linda/linda.png?branch=master)](https://travis-ci.org/node-linda/linda)


Install
-------

    % npm install linda -g
    % linda-server --help

### start linda-server

    % linda-server -p 8931

=> http://localhost:8931


### create your linda-server on Heroku

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/node-linda/linda)


Requirements
------------
- Node.js v0.10
- [Socket.IO](http://socket.io/) v1.2.x


What is Linda?
--------------
Linda is a coordination launguage for parallel programming.

* http://en.wikipedia.org/wiki/Linda_(coordination_language)
* http://ja.wikipedia.org/wiki/Linda


Samples
-------

[sample codes](https://github.com/node-linda/linda/tree/master/samples) works with `linda-server` on your PC.


    % linda-server -p 8931


### Chat

- [simple chat app](http://node-linda.github.io/linda/samples/chat/index.html)


### Job-Queue Client & Worker

- [job worker](http://node-linda.github.io/linda/samples/job-queue/worker.html)
- [job client](http://node-linda.github.io/linda/samples/job-queue/client.html)


Test
----

    % npm install
    % npm test

watch

    % npm install grunt-cli -g
    % grunt



Contributing
------------
1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
