import fs from 'fs';

function getPrivateKey() {
  try {
    return fs.readFileSync(`${__dirname}/server.key`);
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log('Expected server.key to be included in Lambda deployment package');
      // fallthrough
    }
    throw e;
  }
}

export function getPublicKey() {
  try {
    return fs.readFileSync(`${__dirname}/server.crt`);
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log('Expected server.key to be included in Lambda deployment package');
      // fallthrough
    }
    throw e;
  }
}

export const privateKey = getPrivateKey();
export const publicKey = getPublicKey();
