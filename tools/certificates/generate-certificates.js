import { exec } from "child_process";

const KEY_PATH = `${import.meta.dirname}/key.pem`;
const CERT_PATH = `${import.meta.dirname}/cert.pem`;

// Clean up the existing certificates.
exec(`rm -f ${KEY_PATH} ${CERT_PATH}`);

// Generate the new certificates.
exec(`mkcert -key-file ${KEY_PATH} -cert-file ${CERT_PATH} 'localhost'`);
