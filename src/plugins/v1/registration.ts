import type { FastifyInstance, FastifyPluginCallback } from "fastify";
import {
	RegisterEndpoint,
	type PushToken,
	type RegisterParams,
} from "passkit-webservice-toolkit/v1/register.js";
import {
	UnregisterEndpoint,
	type UnregisterParams,
} from "passkit-webservice-toolkit/v1/unregister.js";
import { checkAuthorizationSchemeHook } from "./hooks.js";

interface RegistrationPluginOptions {
	/**
	 * @see https://developer.apple.com/documentation/walletpasses/register_a_pass_for_update_notifications
	 */
	onRegister(
		deviceLibraryIdentifier: string,
		passTypeIdentifier: string,
		serialNumber: string,
	): void;

	/**
	 * @see https://developer.apple.com/documentation/walletpasses/unregister_a_pass_for_update_notifications
	 */
	onUnregister(
		deviceLibraryIdentifier: string,
		passTypeIdentifier: string,
		serialNumber: string,
	): void;
}

function registrationPlugin(
	fastify: FastifyInstance,
	opts: RegistrationPluginOptions,
	done: Parameters<FastifyPluginCallback>[2],
) {
	if (typeof opts.onRegister !== "function") {
		throw new Error("onRegister is not a valid listener");
	}

	if (typeof opts.onUnregister !== "function") {
		throw new Error("onUnregister is not a valid listener");
	}

	fastify.post<{
		Body: PushToken;
		Params: Record<RegisterParams[number], string>;
	}>(RegisterEndpoint.path, {
		prefixTrailingSlash: "no-slash",
		schema: {
			headers: {
				Authorization: { type: "string" },
			},
			params: {
				deviceLibraryIdentifier: { type: "string" },
				passTypeIdentifier: { type: "string" },
				serialNumber: { type: "string" },
			},
			body: {
				type: "object",
				properties: {
					pushToken: { type: "string" },
				},
			},
		},
		preHandler: checkAuthorizationSchemeHook,
		async handler(request, reply) {
			const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } =
				request.params;

			/**
			 * @TODO make onRegister async
			 */
			opts.onRegister(
				deviceLibraryIdentifier,
				passTypeIdentifier,
				serialNumber,
			);

			return reply.code(200);
		},
	});

	fastify.delete<{
		Body: never;
		Params: Record<UnregisterParams[number], string>;
	}>(UnregisterEndpoint.path, {
		prefixTrailingSlash: "no-slash",
		schema: {
			headers: {
				Authorization: { type: "string" },
			},
			params: {
				deviceLibraryIdentifier: { type: "string" },
				passTypeIdentifier: { type: "string" },
				serialNumber: { type: "string" },
			},
		},
		preHandler: checkAuthorizationSchemeHook,
		async handler(request, reply) {
			const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } =
				request.params;

			/**
			 * @TODO make onUnregister async
			 */
			opts.onUnregister(
				deviceLibraryIdentifier,
				passTypeIdentifier,
				serialNumber,
			);

			return reply.code(200);
		},
	});

	done();
}

export default registrationPlugin satisfies FastifyPluginCallback<RegistrationPluginOptions>;
