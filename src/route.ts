import bodyParser from 'body-parser';
import type { Express, Request, RequestHandler, Response } from 'express';
import type { OpenAPIV3 } from 'openapi-types';

export abstract class Route {
	declare options: IRouteOptions;
	public get?(req: Request, res: Response): Promise<void>;
	public post?(req: Request, res: Response): Promise<void>;
	public delete?(req: Request, res: Response): Promise<void>;
    public patch?(req: Request, res: Response): Promise<void>;
    public put?(req: Request, res: Response): Promise<void>;
    public head?(req: Request, res: Response): Promise<void>;
	public app: Express;
	public constructor(app: Express) {
		this.app = app;
	}

    public registerRoute() {
        if (this.get) this.app.get(this.options.path, ...(this.options.middleware ?? []), this.get.bind(this));
        if (this.post) this.app.post(this.options.path, ...(this.options.middleware ?? []), this.post.bind(this));
        if (this.delete) this.app.delete(this.options.path, ...(this.options.middleware ?? []), this.delete.bind(this));
        if (this.patch) this.app.patch(this.options.path, ...(this.options.middleware ?? []), this.patch.bind(this));
        if (this.put) this.app.put(this.options.path, ...(this.options.middleware ?? []), this.put.bind(this));
        if (this.head) this.app.head(this.options.path, ...(this.options.middleware ?? []), this.head.bind(this));
    }
}

// Decorator
export interface IRouteOptions {
	path: string;
	middleware?: RequestHandler[];
	spec: OpenAPIV3.PathItemObject | null;
}

export function RouteOptions(routeOptions: IRouteOptions) {
	return function <T extends { new (...args: any[]): {} }>(constructor: T) {
		return class extends constructor {
			options = routeOptions;
		};
	};
}

// Middleware
export const Middleware = {
	UrlEncoded: bodyParser.urlencoded({ extended: true }),
	Json: bodyParser.json()
};
