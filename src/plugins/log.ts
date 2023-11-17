import { FastifyInstance, FastifyPluginCallback } from "fastify";

/**
 * @see https://developer.apple.com/documentation/walletpasses/log_a_message
 */

/**
 * @see https://developer.apple.com/documentation/walletpasses/logentries
 */
interface LogEntries {
	logs: string[];
}

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
	}>(`/v1/log`, {
		prefixTrailingSlash: "no-slash",
		async handler(request, reply) {
			opts.onIncomingLog(request.body.logs);

			return reply.code(200);
		},
	});

	done();
}

export default logPlugin satisfies FastifyPluginCallback<LogPluginOptions>;
