import { FastifyInstance, FastifyPluginCallback } from "fastify";

/**
 * @see https://developer.apple.com/documentation/walletpasses/get_the_list_of_updatable_passes
 */

/**
 * @see https://developer.apple.com/documentation/walletpasses/serialnumbers
 */

interface SerialNumbers {
	serialNumbers: string[];

	/**
	 * A developer-defined string that contains a tag that
	 * indicates the modification time for the returned passes.
	 *
	 * You use the value of this key for the `previousLastUpdated`
	 * parameter of Get the List of Updatable Passes to return
	 * passes modified after the represented date and time.
	 */

	lastUpdated: string;
}

interface ListPluginOptions<LastUpdatedFormat> {
	onListRetrieve(
		deviceLibraryIdentifier: string,
		passTypeIdentifier: string,
		filters: { previousLastUpdated?: LastUpdatedFormat },
	): PromiseLike<SerialNumbers | undefined>;
}

interface ListPluginParams {
	deviceLibraryIdentifier: string;
	passTypeIdentifier: string;
}

function listPlugin<LastUpdatedFormat = unknown>(
	fastify: FastifyInstance,
	opts: ListPluginOptions<LastUpdatedFormat>,
	done: Parameters<FastifyPluginCallback>[2],
) {
	if (typeof opts.onListRetrieve !== "function") {
		throw new Error("onListRetrieve is not a valid listener");
	}

	fastify.post<{
		Params: ListPluginParams;
		Querystring: {
			previousLastUpdated?: LastUpdatedFormat;
		};
	}>("/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier", {
		prefixTrailingSlash: "no-slash",
		schema: {
			headers: {
				Authorization: { type: "string" },
			},
			params: {
				deviceLibraryIdentifier: { type: "string" },
				passTypeIdentifier: { type: "string" },
			},
			response: {
				200: {
					content: {
						"application/json": {
							type: "object",
							properties: {
								serialNumbers: {
									type: "array",
									items: { type: "string" },
								},
								lastUpdated: { type: "string" },
							},
						},
					},
				},
				204: {},
			},
		},
		async handler(request, reply) {
			const { deviceLibraryIdentifier, passTypeIdentifier } = request.params;
			const filters: { previousLastUpdated?: LastUpdatedFormat } = {
				previousLastUpdated: undefined,
			};

			if (request.query.previousLastUpdated) {
				filters.previousLastUpdated = request.query.previousLastUpdated;
			}

			const retrieve = await opts.onListRetrieve(
				deviceLibraryIdentifier,
				passTypeIdentifier,
				filters,
			);

			debugger;

			if (!retrieve) {
				reply.code(204).send();
				return;
			}

			reply.header("Content-Type", "application/json");
			return reply.code(200).send(retrieve);
		},
	});

	done();
}

export default listPlugin satisfies FastifyPluginCallback<
	ListPluginOptions<unknown>
>;
