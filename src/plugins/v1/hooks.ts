import type {
	FastifyPluginCallback,
	FastifyReply,
	FastifyRequest,
} from "fastify";
import { isAuthorizationSchemeValid } from "passkit-webservice-toolkit/v1/utils/auth.js";

export function checkAuthorizationSchemeHook(
	request: FastifyRequest,
	reply: FastifyReply,
	done: Parameters<FastifyPluginCallback>[2],
) {
	const { authorization = "" } = request.headers;

	if (!isAuthorizationSchemeValid(authorization)) {
		return reply.code(403);
	}

	done();
}
