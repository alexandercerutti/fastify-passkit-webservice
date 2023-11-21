// @ts-check

import Fastify from "fastify";
import { describe, it, beforeEach } from "node:test";
import { strictEqual, rejects } from "node:assert";
import { HandlerNotFoundError } from "../lib/HandlerNotFoundError.js";

describe("update service", () => {
	/**
	 * @type {import("fastify").FastifyInstance};
	 */
	let fastifyInstance;

	beforeEach(() => {
		fastifyInstance = Fastify();
	});

	describe("import", async () => {
		it("should import plugin from direct import", async () => {
			const { default: directFileImport } = await import(
				/** this will give error when package itself is not linked through `pnpm test` */
				"fastify-passkit-webservice/v1/update.js"
			);

			strictEqual(typeof directFileImport, "function");
			strictEqual(directFileImport.name, "updatePlugin");
		});

		it("should import plugin from v1 entry point", async () => {
			const { updatePlugin } = await import(
				/** this will give error when package itself is not linked through `pnpm test` */
				"fastify-passkit-webservice/v1"
			);

			strictEqual(typeof updatePlugin, "function");
			strictEqual(updatePlugin.name, "updatePlugin");
		});

		it("should import v1 plugin from global package entry", async () => {
			const {
				v1: { updatePlugin },
			} = await import(
				/** this will give error when package itself is not linked through `pnpm test` */
				"fastify-passkit-webservice"
			);

			strictEqual(typeof updatePlugin, "function");
			strictEqual(updatePlugin.name, "updatePlugin");
		});
	});

	it("should throw an error if the handler is not provided", async () => {
		await rejects(
			async () => {
				await fastifyInstance.register(import("../lib/plugins/v1/update.js"));
			},
			(/** @type {HandlerNotFoundError} */ err) => {
				strictEqual(err.name, "HandlerNotFoundError");
				return true;
			},
		);
	});
});
