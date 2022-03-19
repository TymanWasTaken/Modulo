import bodyParser from 'body-parser';
import express, { RequestHandler, type Express } from 'express';
import { promises as fs } from 'fs';
import { OpenAPIV3 } from 'openapi-types';
import path from 'path';
import { Route } from './Route';

/**
 * The manager to manage and register all {@link Route}s.
 */
export class RouteManager {
	/**
	 * The internal express instance used for this route manager. Will be passed to all {@link Route}s registered with this manager.
	 */
	public app: Express;
	/**
	 * The path to the directory containing the routes to manage.
	 */
	public routePath: string;
	/**
	 * The middleware to use globally for all routes.
	 */
	public middleware: RequestHandler[];
	/**
	 * An array of all registered {@link Route}s.
	 */
	public routes: Route[];
	/**
	 * The OpenAPI specification for all routes and this app.
	 */
	public spec: OpenAPIV3.Document;

	/**
	 * Creates a new {@link RouteManager} instance.
	 * @param routePath The path to the directory containing the routes to manage.
	 * @param spec The OpenAPI specification for this app. Should not include any route-specific specifications.
	 * @param middleware The middleware to use globally for all routes.
	 */
	public constructor(
		routePath: string,
		spec: OpenAPIV3.Document,
		middleware?: RequestHandler[]
	) {
		this.routePath = routePath;
		this.app = express();
		this.middleware = middleware ?? [];
		for (const handler of this.middleware) {
			this.app.use(middleware)
		}
		this.routes = [];
		this.spec = spec;
	}

	/**
	 * Registers all routes in the directory specified by {@link routePath}.
	 * Also loads thier OpenAPI specs and serves the OpenAPI spec at `/openapi.json`.
	 */
	public async loadRoutes(): Promise<void> {
		// Load all custom routes
		for await (const file of this.recursiveReadDir(this.routePath)) {
			const routeImport = (await import(file)) as { default?: typeof Route };
			if (!routeImport.default) {
				console.warn(
					`Route file ${file} does not export a default Route class.`
				);
				continue;
			}
			const instance =
				new (routeImport.default.prototype.constructor.bind.apply(
					routeImport.default.prototype.constructor,
					[null]
				))(this.app) as Route;
			if (!(instance instanceof Route)) {
				console.warn(
					`Route file ${file} does not export a default Route class.`
				);
				continue;
			}
			instance.registerRoute();
			if (instance.options.spec)
				this.spec.paths[instance.options.path] = instance.options.spec;
			this.routes.push(instance);
		}
		// Add callback for /openapi.json
		this.app.get('/openapi.json', (req, res) =>
			res.status(200).json(this.spec)
		);
	}

	/**
	 * Starts the server on the specified port.
	 * @param port The port to listen on.
	 */
	public async serve(port: number): Promise<void> {
		this.app.listen(port);
		console.log(`Listening on port ${port}`);
	}

	/**
	 * Recursively reads all files in the specified directory.
	 * @param dir The directory to read recursively.
	 * @private
	 */
	private async *recursiveReadDir(dir: string): AsyncIterableIterator<string> {
		const dirents = await fs.readdir(dir, { withFileTypes: true });
		for (const dirent of dirents) {
			const res = path.resolve(dir, dirent.name);
			if (dirent.isDirectory()) {
				yield* this.recursiveReadDir(res);
			} else {
				yield res;
			}
		}
	}
}
