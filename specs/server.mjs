import Fastify from "fastify";
import { networkInterfaces } from "node:os";
import fs from "node:fs";

import passKit from "passkit-generator";
const { PKPass } = passKit;

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

export const fastifyInstance = Fastify({
	logger: true,
});

fastifyInstance.get("/health", (_, reply) => {
	return reply.code(200).send({ status: "OK" });
});

/**
 * @param {object} modifications
 * @return {Promise<passKit.PKPass>}
 */

async function createPass(modifications) {
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
			...modifications,
		},
	);

	pass.transitType = "PKTransitTypeAir";
	pass.setExpirationDate(null);
	pass.setRelevantDate(null);
	pass.setLocations(null);

	return pass;
}

fastifyInstance.get("/testpass", async (_, reply) => {
	const pass = await createPass();

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

fastifyInstance.register(import("../lib/plugins/v1/log.js"), {
	onIncomingLog(logs) {
		console.log("RECEIVED LOGS:", logs);
	},
});

fastifyInstance.register(import("../lib/plugins/v1/registration.js"), {
	onRegister(deviceLibraryIdentifier, passTypeIdentifier, serialNumber) {
		console.log(
			"RECEIVED REGISTER REQUEST",
			deviceLibraryIdentifier,
			passTypeIdentifier,
			serialNumber,
		);

		return true;
	},
	onUnregister(deviceLibraryIdentifier, passTypeIdentifier, serialNumber) {
		console.log(
			"RECEIVED UN-REGISTER REQUEST",
			deviceLibraryIdentifier,
			passTypeIdentifier,
			serialNumber,
		);
	},
	async tokenVerifier(token) {
		console.log("Verifying token", token);
		return true;
	},
});

fastifyInstance.register(import("../lib/plugins/v1/list.js"), {
	async onListRetrieve(
		deviceLibraryIdentifier,
		passTypeIdentifier,
		{ previousLastUpdated },
	) {
		console.log(
			"RECEIVED LIST REQUEST",
			deviceLibraryIdentifier,
			passTypeIdentifier,
			previousLastUpdated,
		);

		return Promise.resolve({
			serialNumber: [],
		});
	},
});

fastifyInstance.register(import("../lib/plugins/v1/update.js"), {
	async onUpdateRequest(passTypeIdentifier, serialNumber) {
		console.log("RECEIVED UPDATE REQUEST", passTypeIdentifier, serialNumber);

		const pass = await createPass({
			voided: true,
			serialNumber,
			passTypeIdentifier,
		});

		return pass.getAsBuffer();
	},
	async tokenVerifier(token) {
		console.log("Verifying token", token);
		return true;
	},
});
