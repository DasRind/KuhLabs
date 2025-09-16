import {
  bootstrapApplication,
  BootstrapContext,
} from '@angular/platform-browser';
import { provideServerRendering } from '@angular/ssr';
import { App } from './app/app';
import { appConfig } from './app/app.config';

export default function bootstrap(context: BootstrapContext) {
  return bootstrapApplication(
    App,
    {
      providers: [provideServerRendering(), ...appConfig.providers],
    },
    context
  );
}
