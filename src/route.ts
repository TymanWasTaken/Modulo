import bodyParser from 'body-parser';
import compression from 'compression';
import type { Express, Request, RequestHandler, Response } from 'express';
import type { OpenAPIV3 } from 'openapi-types';

/**
 * A user created route. Handlers for methods are defined using functions with the same name as the method.
 * In order to add options, you must use the {@link RouteOptions} decorator.
 * @abstract
 */
export abstract class Route {
	/**
	 * The options of the route.
	 * @type {IRouteOptions}
	 */
	declare options: IRouteOptions;
	/**
	 * Handler for a GET request on this route.
	 * @param req The express request object
	 * @param res The express response object
	 */
	public get?(req: Request, res: Response): unknown;
	/**
	 * Handler for a POST request on this route.
	 * @param req The express request object
	 * @param res The express response object
	 */
	public post?(req: Request, res: Response): unknown;
	/**
	 * Handler for a DELETE request on this route.
	 * @param req The express request object
	 * @param res The express response object
	 */
	public delete?(req: Request, res: Response): unknown;
	/**
	 * Handler for a PATCH request on this route.
	 * @param req The express request object
	 * @param res The express response object
	 */
	public patch?(req: Request, res: Response): unknown;
	/**
	 * Handler for a PUT request on this route.
	 * @param req The express request object
	 * @param res The express response object
	 */
	public put?(req: Request, res: Response): unknown;
	/**
	 * Handler for a HEAD request on this route.
	 * @param req The express request object
	 * @param res The express response object
	 */
	public head?(req: Request, res: Response): unknown;
	/**
	 * The internal express instance used for this route.
	 * @type {Express}
	 */
	public app: Express;

	/**
	 * The constructor for a Route. This should only be called by the RouteManager.
	 * @param app The express instance to use for this route.
	 * @constructs Route
	 */
	public constructor(app: Express) {
		this.app = app;
	}

	/**
	 * The internal method to register this route to the express instance. Should only be called by the RouteManager.
	 */
	public registerRoute() {
		if (this.get)
			this.app.get(
				this.options.path,
				...(this.options.middleware ?? []),
				this.get.bind(this)
			);
		if (this.post)
			this.app.post(
				this.options.path,
				...(this.options.middleware ?? []),
				this.post.bind(this)
			);
		if (this.delete)
			this.app.delete(
				this.options.path,
				...(this.options.middleware ?? []),
				this.delete.bind(this)
			);
		if (this.patch)
			this.app.patch(
				this.options.path,
				...(this.options.middleware ?? []),
				this.patch.bind(this)
			);
		if (this.put)
			this.app.put(
				this.options.path,
				...(this.options.middleware ?? []),
				this.put.bind(this)
			);
		if (this.head)
			this.app.head(
				this.options.path,
				...(this.options.middleware ?? []),
				this.head.bind(this)
			);
	}
}

/**
 * Options for a route. Should be used in the {@link RouteOptions} decorator.
 */
export interface IRouteOptions {
	path: string;
	middleware?: RequestHandler[];
	spec: OpenAPIV3.PathItemObject | null;
}

/**
 * Decorator for {@link Route} to apply options to it
 * @param {IRouteOptions} options Options to apply to the route
 */
export function RouteOptions(routeOptions: IRouteOptions) {
	return function <T extends { new (...args: any[]): {} }>(constructor: T) {
		return class extends constructor {
			options = routeOptions;
		};
	};
}

/**
 * Preset middleware to use in your app, can be added to individual routes or in the constructor of {@link RouteManager}
 * @readonly
 */
export const Middleware = {
	UrlEncoded: bodyParser.urlencoded({ extended: true }),
	Json: bodyParser.json(),
	Compression: compression()
} as const;
