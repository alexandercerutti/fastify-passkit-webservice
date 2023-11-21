import { spec } from "node:test/reporters";
import { run } from "node:test";
import process from "node:process";
import path from "node:path";

run({
	files: [
		path.resolve("./specs/log.test.mjs"),
		path.resolve("./specs/list.test.mjs"),
		path.resolve("./specs/update.test.mjs"),
		path.resolve("./specs/registration.test.mjs"),
	],
})
	.compose(new spec())
	.pipe(process.stdout);
