// @ts-check

import Fastify from "fastify";
import { describe, it, beforeEach } from "node:test";
import { strictEqual, rejects } from "node:assert";
import { HandlerNotFoundError } from "../lib/HandlerNotFoundError.js";

describe("log service", () => {
	/**
	 * @type {import("fastify").FastifyInstance};
	 */
	let fastifyInstance;

	beforeEach(() => {
		fastifyInstance = Fastify();
	});

	it("should throw an error if the handler is not provided", async () => {
		await rejects(
			async () => {
				await fastifyInstance.register(import("../lib/plugins/v1/log.js"));
			},
			(/** @type {HandlerNotFoundError} */ err) => {
				strictEqual(err.name, "HandlerNotFoundError");
				return true;
			},
		);
	});
});
