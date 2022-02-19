import { CSSResultGroup, html, LitElement, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators/custom-element.js';
import { query } from 'lit/decorators/query.js';
import { property } from 'lit/decorators/property.js';
import { when } from 'lit/directives/when.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { RippleMixin } from '../shared/ripple-mixin.js';
import { Ripple } from '../ripple/index.js';
import { style } from './list-item-style.js';
import '../icon.js';

@customElement('mdui-list-item')
export class ListItem extends RippleMixin(LitElement) {
  static override styles: CSSResultGroup = style;

  @query('mdui-ripple', true)
  protected rippleElement!: Ripple;

  @property({ type: Boolean, reflect: true })
  public disabled = false;

  @property({ reflect: true })
  public href!: string;

  @property({ reflect: true })
  public download!: string;

  @property({ reflect: true })
  public target!: string;

  @property({ reflect: true })
  public rel!: string;

  @property({ type: Boolean, reflect: true })
  public autofocus = false;

  @property({ reflect: true })
  public icon!: string;

  @property({ reflect: true })
  public iconVariant!: 'outlined' | 'filled' | 'round' | 'sharp' | 'two-tone';

  @property({ reflect: true })
  public avatar!: string;

  @property({ reflect: true })
  public title!: string;

  @property({ reflect: true })
  public description!: string;

  protected override render(): TemplateResult {
    const { disabled, href, download, target, rel } = this;

    return html`<mdui-ripple></mdui-ripple>
      ${when(
        disabled,
        () => html`<span class="item"><slot></slot></span>`,
        () =>
          html`<a
            class="item"
            href=${href ?? 'javascript:;'}
            download=${ifDefined(download)}
            target=${ifDefined(target)}
            rel=${ifDefined(rel)}
          >
            <slot name="lead"></slot>
            <div class="content">
              <slot></slot>
              <slot name="description"></slot>
            </div>
            <slot name="action"></slot>
          </a>`,
      )} `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mdui-list-item': ListItem;
  }
}
