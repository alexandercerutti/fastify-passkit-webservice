import { FastifyInstance, FastifyPluginCallback } from "fastify";
import {
	ListEndpoint,
	type ListParams,
	type SerialNumbers,
} from "passkit-webservice-toolkit/v1/list.js";
import { HandlerNotFoundError } from "../../HandlerNotFoundError.js";

/**
 * @see https://developer.apple.com/documentation/walletpasses/get_the_list_of_updatable_passes
 */

interface ListPluginOptions<LastUpdatedFormat> {
	onListRetrieve(
		deviceLibraryIdentifier: string,
		passTypeIdentifier: string,
		filters: { previousLastUpdated?: LastUpdatedFormat },
	): PromiseLike<SerialNumbers | undefined>;
}

function listPlugin<LastUpdatedFormat = unknown>(
	fastify: FastifyInstance,
	opts: ListPluginOptions<LastUpdatedFormat>,
	done: Parameters<FastifyPluginCallback>[2],
) {
	if (typeof opts.onListRetrieve !== "function") {
		throw new HandlerNotFoundError("onListRetrieve", "ListPlugin");
	}

	fastify.post<{
		Params: Record<ListParams[number], string>;
		Querystring: {
			previousLastUpdated?: LastUpdatedFormat;
		};
	}>(ListEndpoint.path, {
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
