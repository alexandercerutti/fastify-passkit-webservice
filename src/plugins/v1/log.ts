import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import {
	LogEndpoint,
	type LogEntries,
} from "passkit-webservice-toolkit/v1/log.js";
import { HandlerNotFoundError } from "../../HandlerNotFoundError.js";

/**
 * @see https://developer.apple.com/documentation/walletpasses/log_a_message
 */

interface LogPluginOptions {
	onIncomingLogs(logs: string[]): void;
}

async function logPlugin(fastify: FastifyInstance, opts: LogPluginOptions) {
	if (typeof opts.onIncomingLogs !== "function") {
		throw new HandlerNotFoundError("onIncomingLog", "LogPlugin");
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
			opts.onIncomingLogs(request.body.logs);

			return reply.code(200);
		},
	});
}

export default logPlugin satisfies FastifyPluginAsync<LogPluginOptions>;
