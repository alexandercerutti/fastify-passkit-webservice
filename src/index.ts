import type { FastifyRequest } from "fastify";

function getAuthorizationToken(request: FastifyRequest): string | undefined {
	if (!request.headers["Authorization"]) {
		return undefined;
	}

	const [, passAuthorizationToken] = (
		request.headers["Authorization"] as string
	).split("\x20");

	if (!passAuthorizationToken?.length) {
		return undefined;
	}

	return passAuthorizationToken;
}
