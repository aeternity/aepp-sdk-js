import fs from 'fs';

const swaggerUrl =
  'https://raw.githubusercontent.com/aeternity/aesophia_http/v8.0.0/config/swagger.yaml';

const response = await fetch(swaggerUrl);
console.assert(response.status === 200, 'Invalid response code', response.status);
let swagger = await response.text();

swagger = swagger.replace(/basePath: \//, '');
// TODO: Remove after fixing https://github.com/aeternity/aesophia_http/issues/87
swagger = swagger.replace(/'400':.{80,120}?Error'\s+'400':/gms, "'400':");
await fs.promises.writeFile('./tooling/autorest/compiler-swagger.yaml', swagger);
