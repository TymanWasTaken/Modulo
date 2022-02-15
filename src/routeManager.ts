import bodyParser from 'body-parser';
import express, { RequestHandler, type Express } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { Route } from './route';

export class RouteManager {
	public app: Express;
	public routePath: string;
	public middleware: RequestHandler[];
    public routes: Route[];

	public constructor(routePath: string, middleware?: RequestHandler[]) {
		this.routePath = routePath;
		this.app = express();
		this.middleware = middleware ?? [];
		this.middleware.push(bodyParser.json());
		this.middleware.push(bodyParser.urlencoded({ extended: true }));
        this.routes = []
	}

	public async loadRoutes(): Promise<void> {
        for await (const file of this.recursiveReadDir(this.routePath)) {
            const routeImport = await import(file) as { default?: typeof Route };
            if (!routeImport.default) {
                console.warn(`Route file ${file} does not export a default Route class.`);
                continue;
            }
            const instance = new (routeImport.default.prototype.constructor.bind.apply(
                routeImport.default.prototype.constructor,
                [null]
            ))(this.app) as Route;
            if (!(instance instanceof Route)) {
                console.warn(`Route file ${file} does not export a default Route class.`);
                continue
            }
            instance.registerRoute();
            this.routes.push(instance);
        }
    }

    public async serve(port: number): Promise<void> {
        this.app.listen(port);
        console.log(`Listening on port ${port}`);
    }

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
