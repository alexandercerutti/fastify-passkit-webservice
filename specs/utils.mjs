/**
 * @param {import("fastify").FastifyInstance} instance
 * @return {Promise<string>}
 */

export async function startFastify(instance) {
	return new Promise((resolve) => {
		instance.listen({ port: 0, host: "localhost" }, (err, address) => {
			resolve(address);
		});
	});
}
