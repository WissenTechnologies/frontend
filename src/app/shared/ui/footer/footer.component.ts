import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

import { IconModule } from '../icon';

interface PersonalLink {
  label: string;
  href: string;
  icon: IconProp;
}

@Component({
  selector: 'aa-footer',
  imports: [DatePipe, IconModule, MatButtonModule],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  @Input({ required: true })
  version = '';

  readonly now = new Date();
  readonly personalLinks: PersonalLink[] = [
    {
      label: 'Voldemort Trade',
      href: 'https://voldemort-trade.com',
      icon: 'list',
    },
  ];
}
