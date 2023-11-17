import Fastify from "fastify";
import { networkInterfaces } from "node:os";

const IPV4Interfaces = {};

for (const [ifName, netIf] of Object.entries(networkInterfaces())) {
	for (let i = 0; i < netIf.length; i++) {
		const netInterface = netIf[i];
		const isIPv4 = netInterface.family == "IPv4";
		const isLoopback = netInterface.address === "127.0.0.1";

		const isSuitable = isIPv4 && !isLoopback && !netInterface.internal;

		if (isSuitable) {
			IPV4Interfaces[ifName] = IPV4Interfaces[ifName] || [];
			IPV4Interfaces[ifName].push(netInterface);
		}
	}
}

console.log(IPV4Interfaces);

export const fastifyInstance = Fastify({
	logger: true,
});

fastifyInstance.get("/health", (_, reply) => {
	return reply.code(200).send({ status: "OK" });
});

fastifyInstance.get("/testpass", async (_, reply) => {
	const pass = await PKPass.from(
		{
			model: "../passkit-generator/examples/models/exampleBooking.pass",
			certificates: {
				signerCert: fs.readFileSync(
					"../passkit-generator/certificates/signerCert.pem",
				),
				signerKey: fs.readFileSync(
					"../passkit-generator/certificates/signerKey.pem",
				),
				wwdr: fs.readFileSync("../passkit-generator/certificates/WWDRG4.pem"),
				signerKeyPassphrase: "123456",
			},
		},
		{
			serialNumber: String(Math.random() * 100),
			webServiceURL: `http://${
				Object.entries(IPV4Interfaces)[0][1][0].address
			}:3500`,
			authenticationToken: "mimmomimmoqgeqwyidukqq",
			voided: false,
		},
	);

	pass.transitType = "PKTransitTypeAir";
	pass.setExpirationDate(null);
	pass.setRelevantDate(null);
	pass.setLocations(null);

	reply.header("Content-Type", pass.mimeType);
	reply.header("Content-Disposition", `attachment; filename="pass.pkpass"`);
	reply.code(200);
	reply.send(pass.getAsBuffer());
});

fastifyInstance.addHook("onRoute", (routeOptions) => {
	console.log("Added new route:", routeOptions.method, routeOptions.url);
});

fastifyInstance.listen(
	{ port: 3500, host: "0.0.0.0" },
	function (err, address) {
		if (err) {
			fastifyInstance.log.error(err);
			process.exit(1);
		}

		console.log(`Listening on ${address}`);
	},
);

// ******

import fs from "node:fs";
import router from "../lib/index.js";
import passKit from "passkit-generator";

const { PKPass } = passKit;

debugger;

fastifyInstance.register(router, {
	walletPasses: {
		v1: {
			log: true,
			register: true,
			unregister: true,
			listUpdatable: true,
		},
	},
});
