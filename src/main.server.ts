import {
  bootstrapApplication,
  BootstrapContext,
} from '@angular/platform-browser';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { SERVER_ROUTES } from './server.routes';

export default function bootstrap(context: BootstrapContext) {
  return bootstrapApplication(
    App,
    {
      providers: [provideServerRendering(withRoutes(SERVER_ROUTES)), ...appConfig.providers],
    },
    context
  );
}
