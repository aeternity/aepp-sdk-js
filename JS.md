# Documentation for the JS SDK

## Principles

The Javascript SDK wraps the æternity API, as explosed by [the swagger file](https://github.com/aeternity/epoch/blob/master/config/swagger.yaml). It aims to abstract the API, while still providing low-level access when necessary.


There are two approaches, purist and high-level. This document descr

The purist one uses the functions generated out of the Swagger
file. After `create`ing the client and `await`ing it (or use `.then`),
it exposes a mapping of all `operationId`s as functions, converted to
camelCase (from PascalCase). So e.g. in order to get a transaction
based on its hash, you would invoke `client.api.getTx(query)`. Indeed,
for this functionality, there isn't even a high-level call right now,
but this is simply a flaw because of the refactoring.  Optional
parameters to API calls are exposed as a single last object argument
with keywords, also converted to pascal Case.  Actually, by looking at
the new high level code (in client/, everything but index.js which
generates the low level API), it gives you a good idea on how it
works.  One of the near-future goals shall be to document on how to
achieve different things on the chain using both high-level and
low-level calls.  However, in general, we shall move towards providing
high-level abstractions for everything - especially because
eventually, we must not use Epoch to generate transactions anymore,
which means everything which is `POST`ing except for /tx which is to
post the actual encoded transactions we shall generate in the client
in the future.
