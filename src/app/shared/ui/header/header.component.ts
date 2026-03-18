import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AuthUser } from '../../../auth';
import { AvatarComponent } from '../avatar/avatar.component';
import { ThemeService } from '../../../core/services/theme.service';

interface MenuItem {
  link: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'aa-header',
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatIconModule,
    RouterLink,
    RouterLinkActive,
    AvatarComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  private readonly themeService = inject(ThemeService);

  @Input({ required: true })
  authUser: AuthUser | null | undefined = null;

  @Output() logout = new EventEmitter<void>();

  readonly menuItems: MenuItem[] = [
    { link: '/market', label: 'Market', icon: 'list' },
    { link: '/terminal', label: 'Terminal', icon: 'desktop_windows', adminOnly: true },
  ];

  get isDarkMode() {
    return this.themeService.getMode() === 'dark';
  }

  toggleTheme() {
    this.themeService.toggle();
  }
}
