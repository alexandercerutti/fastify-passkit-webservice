import type { FastifyInstance, FastifyPluginCallback } from "fastify";
import {
	UpdateEndpoint,
	type UpdateParams,
} from "passkit-webservice-toolkit/v1/update.js";

/**
 * @see https://developer.apple.com/documentation/walletpasses/send_an_updated_pass
 */

interface LogPluginOptions {
	onUpdateRequest(
		passTypeIdentifier: string,
		serialNumber: string,
	): PromiseLike<Uint8Array>;
}

function updatePlugin(
	fastify: FastifyInstance,
	opts: LogPluginOptions,
	done: Parameters<FastifyPluginCallback>[2],
) {
	if (typeof opts.onUpdateRequest !== "function") {
		throw new Error("onUpdateRequest is not a valid listener");
	}

	fastify.get<{
		Params: Record<UpdateParams[number], string>;
	}>(UpdateEndpoint.path, {
		prefixTrailingSlash: "no-slash",
		schema: {
			headers: {
				Authorization: { type: "string" },
			},
			params: {
				passTypeIdentifier: { type: "string" },
				serialNumber: { type: "string" },
			},
			response: {
				200: {
					content: {
						"application/vnd.apple.pkpass": {},
					},
				},
			},
		},
		async handler(request, reply) {
			const { passTypeIdentifier, serialNumber } = request.params;

			const response = await opts.onUpdateRequest(
				passTypeIdentifier,
				serialNumber,
			);

			reply.header("Content-Type", "application/vnd.apple.pkpass");
			return reply.code(200).send(response);
		},
	});

	done();
}

export default updatePlugin satisfies FastifyPluginCallback<LogPluginOptions>;