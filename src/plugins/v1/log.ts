import type { FastifyInstance, FastifyPluginCallback } from "fastify";
import {
	LogEndpoint,
	type LogEntries,
} from "passkit-webservice-toolkit/v1/log.js";

/**
 * @see https://developer.apple.com/documentation/walletpasses/log_a_message
 */

interface LogPluginOptions {
	onIncomingLog(logs: string[]): void;
}

function logPlugin(
	fastify: FastifyInstance,
	opts: LogPluginOptions,
	done: Parameters<FastifyPluginCallback>[2],
) {
	if (typeof opts.onIncomingLog !== "function") {
		throw new Error("onIncomingLog is not a valid listener");
	}

	fastify.post<{
		Body: LogEntries;
	}>(LogEndpoint.path, {
		prefixTrailingSlash: "no-slash",
		schema: {
			body: {
				type: "object",
				properties: {
					logs: {
						type: "array",
						items: { type: "string" },
					},
				},
			},
		},
		async handler(request, reply) {
			opts.onIncomingLog(request.body.logs);

			return reply.code(200);
		},
	});

	done();
}

export default logPlugin satisfies FastifyPluginCallback<LogPluginOptions>;
