import type {
	FastifyInstance,
	FastifyPluginCallback,
	FastifyReply,
	FastifyRequest,
	RouteOptions,
} from "fastify";

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

const WALLET_PASSES_WEB_SERVICES_ROUTES_V1 = {
	/**
	 * @see https://developer.apple.com/documentation/walletpasses/register_a_pass_for_update_notifications
	 */
	register: {
		url: "/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber",
		method: "POST",
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
		handler(request, reply) {
			console.log("HANDLING REQUEST", request.url);
			reply.code(200);
		},
	},
	/**
	 * @see https://developer.apple.com/documentation/walletpasses/unregister_a_pass_for_update_notifications
	 */
	unregister: {
		url: "/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber",
		method: "DELETE",
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
		handler(request, reply) {
			console.log("HANDLING REQUEST", request.url);
			reply.code(200);
		},
	},
	/**
	 * @see https://developer.apple.com/documentation/walletpasses/send_an_updated_pass
	 */
	update: {
		url: "/v1/passes/:passTypeIdentifier/:serialNumber",
		method: "GET",
		prefixTrailingSlash: "no-slash",
		schema: {
			headers: {
				Authorization: { type: "string" },
			},
			params: {
				passTypeIdentifier: { type: "string" },
				serialNumber: { type: "string" },
			},
		},
		handler(request, reply) {
			console.log("HANDLING REQUEST", request.url);
			reply.code(200);
		},
	},
	/**
	 * @see https://developer.apple.com/documentation/walletpasses/get_the_list_of_updatable_passes
	 */
	listUpdatable: {
		url: "/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier",
		method: "POST",
		prefixTrailingSlash: "no-slash",
		schema: {
			querystring: {
				passesUpdatedSince: { type: "string" },
			},
			params: {
				deviceLibraryIdentifier: { type: "string" },
				passTypeIdentifier: { type: "string" },
				serialNumber: { type: "string" },
			},
		},
		handler(request, reply) {
			console.log("HANDLING REQUEST", request.url);
			reply.code(200);
		},
	},
} as const satisfies Readonly<{
	[serviceName: string]: RouteOptions;
}>;

type WALLET_PASSES_WEB_SERVICES_V1 =
	keyof typeof WALLET_PASSES_WEB_SERVICES_ROUTES_V1;

interface RouterOptions {
	walletPasses: {
		v1: Record<WALLET_PASSES_WEB_SERVICES_V1, boolean>;
	};
}

function router(
	fastify: FastifyInstance,
	opts: RouterOptions,
	done: Parameters<FastifyPluginCallback>[2],
) {
	const serviceEntries = Object.entries(
		WALLET_PASSES_WEB_SERVICES_ROUTES_V1,
	) as [WALLET_PASSES_WEB_SERVICES_V1, RouteOptions][];

	fastify.addHook("preHandler", (request, reply, done) => {
		debugger;
		const service = serviceEntries.find(([_, { url }]) =>
			request.url.includes(url),
		);

		if (!service) {
			return done();
		}

		const headers =
			(service[1].schema?.headers as { Authorization: string }) || {};

		if (!headers?.["Authorization"]) {
			return done();
		}

		if (!getAuthorizationToken(request)) {
			return reply.code(401).send();
		}
	});

	for (const [service, routeConfig] of serviceEntries) {
		if (!opts.walletPasses?.v1?.[service]) {
			continue;
		}

		fastify.route({
			...routeConfig,
			handler: async function (request, reply) {
				console.log("REQUEST FROM HANDLER", request.url, request.body);
			} satisfies RouteOptions["handler"],
		});
	}

	done();
}

export default router satisfies FastifyPluginCallback<RouterOptions>;
