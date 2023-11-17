import { FastifyInstance, FastifyPluginCallback } from "fastify";

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

interface RegistrationPluginParams {
	deviceLibraryIdentifier: string;
	passTypeIdentifier: string;
	serialNumber: string;
}

/**
 * @see https://developer.apple.com/documentation/walletpasses/pushtoken
 */
interface PushToken {
	pushToken: string;
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
		Params: RegistrationPluginParams;
	}>(
		"/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber",
		{
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
		},
	);

	fastify.delete<{
		Body: never;
		Params: RegistrationPluginParams;
	}>(
		"/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber",
		{
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
		},
	);

	done();
}

export default registrationPlugin satisfies FastifyPluginCallback<RegistrationPluginOptions>;
