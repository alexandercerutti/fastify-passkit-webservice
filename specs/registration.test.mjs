// @ts-check

import Fastify from "fastify";
import { describe, it, beforeEach } from "node:test";
import { strictEqual, rejects } from "node:assert";
import { HandlerNotFoundError } from "../lib/HandlerNotFoundError.js";

describe("registration service", () => {
	/**
	 * @type {import("fastify").FastifyInstance};
	 */
	let fastifyInstance;

	beforeEach(() => {
		fastifyInstance = Fastify();
	});

	it("should throw an error if handlers are not provided", async () => {
		await rejects(
			async () => {
				await fastifyInstance.register(
					import("../lib/plugins/v1/registration.js"),
				);
			},
			(/** @type {HandlerNotFoundError} */ err) => {
				strictEqual(err.name, "HandlerNotFoundError");
				return true;
			},
		);
	});
});
