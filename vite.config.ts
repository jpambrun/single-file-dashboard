import { defineConfig, Plugin } from "vite"
import { viteSingleFile } from "vite-plugin-singlefile"
import * as fs from "fs"

const base64Loader: Plugin = {
	name: "base64-loader",
	transform(_: any, id: string) {
		const [path, query] = id.split("?");
		if (query != "base64") return null;

		const data = fs.readFileSync(path);
		const base64 = data.toString("base64");

		return `export default '${base64}';`;
	},
};

export default defineConfig({
	plugins: [base64Loader, viteSingleFile()],
	build: { target: "esnext" }
})
