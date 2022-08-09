import https from 'https';
import fs from 'fs';

const swaggerUrl = 'https://raw.githubusercontent.com/aeternity/aesophia_http/v7.0.1/config/swagger.yaml';

let swagger = await new Promise((resolve) => {
  https.get(swaggerUrl, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('close', () => resolve(data));
  }).end();
});

swagger = swagger.replace(/basePath: \//, '');
// TODO: Remove after fixing https://github.com/aeternity/aesophia_http/issues/87
swagger = swagger.replace(/'400':.{80,120}?Error'\s+'400':/gms, '\'400\':');
await fs.promises.writeFile('./tooling/autorest/compiler-swagger.yaml', swagger);
