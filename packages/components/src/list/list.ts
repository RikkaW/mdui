import { CSSResultGroup, html, LitElement, TemplateResult } from 'lit';
import {
  customElement,
  property,
  queryAssignedElements,
} from 'lit/decorators.js';
import { watch } from '@mdui/shared/decorators/watch.js';
import { componentStyle } from '@mdui/shared/lit-styles/component-style.js';
import { ListItem } from './list-item.js';
import { listStyle } from './list-style.js';

@customElement('mdui-list')
export class List extends LitElement {
  static override styles: CSSResultGroup = [componentStyle, listStyle];

  @queryAssignedElements({ selector: 'mdui-list-item', flatten: true })
  protected itemElements!: ListItem[] | null;

  /**
   * 是否使所有列表项都不可点击，但其中的 checkbox、radio、switch 等仍可进行交互
   */
  @property({ type: Boolean, reflect: true })
  public nonclickable = false;

  /**
   * 是否所有列表项都使用圆角形状
   */
  @property({ type: Boolean, reflect: true })
  public rounded = false;

  /**
   * 主文本行数，超过行数限制后会截断显示。默认为没有行数限制
   */
  @property({ type: Number, reflect: true })
  public primaryLine!: 1 | 2 | 3;

  /**
   * 副文本行数，超过行数限制后会截断显示。默认为没有行数限制
   */
  @property({ type: Number, reflect: true })
  public secondaryLine!: 1 | 2 | 3;

  @watch('rounded')
  @watch('nonclickable')
  @watch('primaryLine')
  @watch('secondaryLine')
  private onSlotChange() {
    const itemElements = this.itemElements ?? [];

    itemElements.forEach((itemElement) => {
      if (this.rounded) {
        itemElement.rounded = this.rounded;
      }

      if (this.nonclickable) {
        itemElement.nonclickable = this.nonclickable;
      }

      if (this.primaryLine) {
        itemElement.primaryLine = this.primaryLine;
      }

      if (this.secondaryLine) {
        itemElement.secondaryLine = this.secondaryLine;
      }
    });
  }

  protected override render(): TemplateResult {
    return html`<slot @slotchange=${this.onSlotChange}></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mdui-list': List;
  }
}
