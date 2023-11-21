import type {
	FastifyInstance,
	FastifyPluginCallback,
	preHandlerAsyncHookHandler,
	preHandlerHookHandler,
} from "fastify";
import {
	UpdateEndpoint,
	type UpdateParams,
} from "passkit-webservice-toolkit/v1/update.js";
import {
	checkAuthorizationSchemeHook,
	createTokenVerifierHook,
} from "./hooks.js";
import { HandlerNotFoundError } from "../../HandlerNotFoundError.js";

/**
 * @see https://developer.apple.com/documentation/walletpasses/send_an_updated_pass
 */

interface UpdatePluginOptions {
	tokenVerifier?(token: string): PromiseLike<boolean>;
	onUpdateRequest(
		passTypeIdentifier: string,
		serialNumber: string,
	): PromiseLike<Uint8Array>;
}

async function updatePlugin(
	fastify: FastifyInstance,
	opts: UpdatePluginOptions,
) {
	if (typeof opts.onUpdateRequest !== "function") {
		throw new HandlerNotFoundError("onUpdateRequest", "UpdatePlugin");
	}

	const preHandlerHooks: (
		| preHandlerAsyncHookHandler
		| preHandlerHookHandler
	)[] = [checkAuthorizationSchemeHook];

	if (typeof opts.tokenVerifier === "function") {
		preHandlerHooks.push(createTokenVerifierHook(opts.tokenVerifier));
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
		preHandler: preHandlerHooks,
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
}

export default updatePlugin satisfies FastifyPluginCallback<UpdatePluginOptions>;
