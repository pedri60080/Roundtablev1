import { Pipe, PipeTransform } from '@angular/core';
import { formatDeployVersion } from './format-deploy-version';

@Pipe({
  name: 'formatDeployVersion',
  standalone: true,
})
export class FormatDeployVersionPipe implements PipeTransform {
  transform(value: string): string {
    return formatDeployVersion(value);
  }
}
