import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'countType', standalone: false })
export class CountTypePipe implements PipeTransform {
  transform(sections: { type: string }[], type: string): number {
    return sections.filter((s) => s.type === type).length;
  }
}
