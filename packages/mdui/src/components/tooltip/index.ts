import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { when } from 'lit/directives/when.js';
import { $ } from '@mdui/jq/$.js';
import '@mdui/jq/methods/css.js';
import '@mdui/jq/methods/filter.js';
import '@mdui/jq/methods/height.js';
import '@mdui/jq/methods/prop.js';
import '@mdui/jq/methods/width.js';
import { HasSlotController } from '@mdui/shared/controllers/has-slot.js';
import { HoverController } from '@mdui/shared/controllers/hover.js';
import { watch } from '@mdui/shared/decorators/watch.js';
import { animateTo, stopAnimations } from '@mdui/shared/helpers/animate.js';
import { booleanConverter } from '@mdui/shared/helpers/decorator.js';
import { emit } from '@mdui/shared/helpers/event.js';
import { getDuration, getEasing } from '@mdui/shared/helpers/motion.js';
import { observeResize } from '@mdui/shared/helpers/observeResize.js';
import { componentStyle } from '@mdui/shared/lit-styles/component-style.js';
import { style } from './style.js';
import type { ObserveResize } from '@mdui/shared/helpers/observeResize.js';
import type { CSSResultGroup, TemplateResult, PropertyValues } from 'lit';
import type { Ref } from 'lit/directives/ref.js';

/**
 * @event open - tooltip 开始显示时，事件被触发。可以通过调用 `event.preventDefault()` 阻止 tooltip 打开
 * @event opened - tooltip 显示动画完成时，事件被触发
 * @event close - tooltip 开始隐藏时，事件被触发。可以通过调用 `event.preventDefault()` 阻止 tooltip 关闭
 * @event closed - tooltip 隐藏动画完成时，事件被触发
 *
 * @slot - tooltip 触发的目标元素，仅 default slot 中的第一个元素会作为目标元素
 * @slot headline - tooltip 的标题，仅 `variant="rich"` 时该 slot 才有效
 * @slot content - tooltip 的内容，可以包含 HTML。若只包含纯文本，可以使用 content 属性代替
 * @slot action - tooltip 底部的按钮，仅 `variant="rich"` 时该 slot 才有效
 *
 * @csspart popup - tooltip 的容器
 * @csspart headline - tooltip 的标题
 * @csspart content - tooltip 的内容
 * @csspart actions - tooltip 的操作按钮的容器
 */
@customElement('mdui-tooltip')
export class Tooltip extends LitElement {
  public static override styles: CSSResultGroup = [componentStyle, style];

  /**
   * tooltip 的形状。可选值为：
   * * `plain`：纯文本，用于简单的单行文本
   * * `rich`：富文本，可包含标题、正文、及操作按钮
   */
  @property({ reflect: true })
  public variant:
    | 'plain' /*纯文本，用于简单的单行文本*/
    | 'rich' /*富文本，可包含标题、正文、及操作按钮*/ = 'plain';

  /**
   * tooltip 的位置。可选值为：
   * * `auto`：自动判断位置。`variant="plan"` 时，优先使用 `top`；`variant="rich"` 时，优先使用 `bottom-right`
   * * `top-left`：位于左上方
   * * `top-start`：位于上方，且左对齐
   * * `top`：位于上方，且居中对齐
   * * `top-end`：位于上方，且右对齐
   * * `top-right`：位于右上方
   * * `bottom-left`：位于左下方
   * * `bottom-start`：位于下方，且左对齐
   * * `bottom`：位于下方，且居中对齐
   * * `bottom-end`：位于下方，且右对齐
   * * `bottom-right`：位于右下方
   * * `left-start`：位于左侧，且顶部对齐
   * * `left`：位于左侧，且居中对齐
   * * `left-end`：位于左侧，且底部对齐
   * * `right-start`：位于右侧，且顶部对齐
   * * `right`：位于右侧，且居中对齐
   * * `right-end`：位于右侧，且底部对齐
   */
  @property({ reflect: true })
  public placement:
    | 'auto' /*自动判断位置*/
    | 'top-left' /*位于左上方*/
    | 'top-start' /*位于上方，且左对齐*/
    | 'top' /*位于上方，且居中对齐*/
    | 'top-end' /*位于上方，且右对齐*/
    | 'top-right' /*位于右上方*/
    | 'bottom-left' /*位于左下方*/
    | 'bottom-start' /*位于下方，且左对齐*/
    | 'bottom' /*位于下方，且居中对齐*/
    | 'bottom-end' /*位于下方，且右对齐*/
    | 'bottom-right' /*位于右下方*/
    | 'left-start' /*位于左侧，且顶部对齐*/
    | 'left' /*位于左侧，且居中对齐*/
    | 'left-end' /*位于左侧，且底部对齐*/
    | 'right-start' /*位于右侧，且顶部对齐*/
    | 'right' /*位于右侧，且居中对齐*/
    | 'right-end' /*位于右侧，且底部对齐*/ = 'auto';

  /**
   * hover 触发显示的延时，单位为毫秒
   */
  @property({ type: Number, reflect: true, attribute: 'open-delay' })
  public openDelay = 150;

  /**
   * hover 触发隐藏的延时，单位为毫秒
   */
  @property({ type: Number, reflect: true, attribute: 'close-delay' })
  public closeDelay = 150;

  /**
   * tooltip 的标题。仅 variant="rich" 时可使用
   */
  @property({ reflect: true })
  public headline?: string;

  /**
   * tooltip 的内容
   */
  @property({ reflect: true })
  public content?: string;

  /**
   * 触发方式，支持传入多个值，用空格分隔。可选值为：
   * * `click`
   * * `hover`
   * * `focus`
   * * `manual`：使用了该值时，只能使用编程方式打开和关闭 tooltip，且不能再指定其他触发方式
   */
  @property({ reflect: true })
  public trigger:
    | 'click' /*鼠标点击触发*/
    | 'hover' /*鼠标悬浮触发*/
    | 'focus' /*聚焦时触发*/
    | 'manual' /*通过编程方式触发*/
    | string = 'hover focus';

  /**
   * 是否禁用 tooltip
   */
  @property({
    type: Boolean,
    reflect: true,
    converter: booleanConverter,
  })
  public disabled = false;

  /**
   * 是否显示 tooltip
   */
  @property({
    type: Boolean,
    reflect: true,
    converter: booleanConverter,
  })
  public open = false;

  private observeResize?: ObserveResize;
  private target!: HTMLElement;
  private hoverTimeout!: number;
  private readonly popupRef: Ref<HTMLElement> = createRef();
  private readonly hasSlotController = new HasSlotController(
    this,
    'headline',
    'action',
  );
  private readonly hoverController = new HoverController(this, this.popupRef);

  public constructor() {
    super();

    this.onDocumentClick = this.onDocumentClick.bind(this);
    this.onWindowScroll = this.onWindowScroll.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onKeydown = this.onKeydown.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
  }

  @watch('placement', true)
  @watch('content', true)
  private async onPositionChange() {
    if (this.open) {
      this.updatePositioner();
    }
  }

  @watch('open')
  private async onOpenChange() {
    const hasUpdated = this.hasUpdated;

    const duration = getDuration(this, 'short4');
    const easing = getEasing(this, 'standard');

    // 打开
    // 要区分是否首次渲染，首次渲染时不触发事件，不执行动画；非首次渲染，触发事件，执行动画
    if (this.open) {
      // 先关闭页面中所有其他相同 variant 的 tooltip
      $(`mdui-tooltip[variant="${this.variant}"]`)
        .filter((_, element) => element !== this)
        .prop('open', false);

      if (!hasUpdated) {
        await this.updateComplete;
      }

      if (hasUpdated) {
        const requestOpen = emit(this, 'open', {
          cancelable: true,
        });
        if (requestOpen.defaultPrevented) {
          return;
        }
      }

      await stopAnimations(this.popupRef.value!);
      this.popupRef.value!.hidden = false;
      this.updatePositioner();
      await animateTo(
        this.popupRef.value!,
        [{ transform: 'scale(0)' }, { transform: 'scale(1)' }],
        {
          duration: hasUpdated ? duration : 0,
          easing,
        },
      );

      if (hasUpdated) {
        emit(this, 'opened');
      }

      return;
    }

    // 关闭
    if (!this.open && hasUpdated) {
      const requestClose = emit(this, 'close', {
        cancelable: true,
      });
      if (requestClose.defaultPrevented) {
        return;
      }

      await stopAnimations(this.popupRef.value!);
      await animateTo(
        this.popupRef.value!,
        [{ transform: 'scale(1)' }, { transform: 'scale(0)' }],
        { duration, easing },
      );
      this.popupRef.value!.hidden = true;
      emit(this, 'closed');
      return;
    }
  }

  public override connectedCallback(): void {
    super.connectedCallback();

    document.addEventListener('pointerdown', this.onDocumentClick);
    window.addEventListener('scroll', this.onWindowScroll);

    // trigger 尺寸变化时，重新调整 tooltip 的位置
    this.updateComplete.then(() => {
      this.observeResize = observeResize(this.target, () => {
        this.updatePositioner();
      });
    });
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();

    document.removeEventListener('pointerdown', this.onDocumentClick);
    window.removeEventListener('scroll', this.onWindowScroll);

    this.observeResize?.unobserve();
  }

  protected override firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    this.target = this.getTarget();

    this.target.addEventListener('focus', this.onFocus);
    this.target.addEventListener('blur', this.onBlur);
    this.target.addEventListener('pointerdown', this.onClick);
    this.target.addEventListener('keydown', this.onKeydown);
    this.target.addEventListener('mouseenter', this.onMouseEnter);
    this.target.addEventListener('mouseleave', this.onMouseLeave);
  }

  protected override render(): TemplateResult {
    const hasHeadlineSlot = this.hasSlotController.test('headline');
    const hasActionSlot = this.hasSlotController.test('action');

    const hasHeadline = this.isRich() && (this.headline || hasHeadlineSlot);
    const hasAction = this.isRich() && hasActionSlot;

    return html`<slot></slot>
      <div ${ref(this.popupRef)} part="popup" class="popup" hidden>
        ${when(
          hasHeadline,
          () =>
            html`<div part="headline" class="headline">
              <slot name="headline">${this.headline}</slot>
            </div>`,
        )}
        <div part="content" class="content">
          <slot name="content">${this.content}</slot>
        </div>
        ${when(
          hasAction,
          () =>
            html`<div part="actions" class="actions">
              <slot name="action"></slot>
            </div>`,
        )}
      </div>`;
  }

  private isRich(): boolean {
    return this.variant === 'rich';
  }

  /**
   * 请求关闭 tooltip。鼠标未悬浮在 tooltip 上时，直接关闭；否则等鼠标移走再关闭
   */
  private async requestClose() {
    if (!this.hoverController.isHover) {
      this.open = false;
      return;
    }

    this.hoverController.onMouseLeave(() => {
      if (this.hasTrigger('hover')) {
        // 同时使用 hover focus 时，leave 比 focus 先触发，导致 leave 后触发 focus，而显示 tooltip
        // 所以延迟执行 leave
        this.hoverTimeout = window.setTimeout(() => {
          this.open = false;
        }, this.closeDelay || 50);
      } else {
        this.open = false;
      }
    }, true);
  }

  /**
   * 获取第一个非 <style> 和 content slot 的子元素，作为 tooltip 的目标元素
   */
  private getTarget(): HTMLElement {
    return [...(this.children as unknown as HTMLElement[])].find(
      (el) =>
        el.tagName.toLowerCase() !== 'style' &&
        el.getAttribute('slot') !== 'content',
    )!;
  }

  private hasTrigger(trigger: string): boolean {
    const triggers = this.trigger.split(' ');
    return triggers.includes(trigger);
  }

  private onFocus() {
    if (this.disabled || this.open || !this.hasTrigger('focus')) {
      return;
    }

    this.open = true;
  }

  private onBlur() {
    if (this.disabled || !this.open || !this.hasTrigger('focus')) {
      return;
    }

    this.requestClose();
  }

  private onClick(e: MouseEvent) {
    // e.button 为 0 时，为鼠标左键点击。忽略鼠标中间和右键
    if (this.disabled || e.button || !this.hasTrigger('click')) {
      return;
    }

    // 支持 hover 和 focus 触发时，点击时，不关闭 tooltip
    if (this.open && (this.hasTrigger('hover') || this.hasTrigger('focus'))) {
      return;
    }

    this.open = !this.open;
  }

  private onKeydown(e: KeyboardEvent) {
    if (this.disabled || !this.open || e.key !== 'Escape') {
      return;
    }

    e.stopPropagation();
    this.requestClose();
  }

  private onMouseEnter() {
    if (this.disabled || this.open || !this.hasTrigger('hover')) {
      return;
    }

    if (this.openDelay) {
      window.clearTimeout(this.hoverTimeout);
      this.hoverTimeout = window.setTimeout(() => {
        this.open = true;
      }, this.openDelay);
    } else {
      this.open = true;
    }
  }

  private onMouseLeave() {
    window.clearTimeout(this.hoverTimeout);

    if (this.disabled || !this.open || !this.hasTrigger('hover')) {
      return;
    }

    // 同时使用 hover focus 时，leave 比 focus 先触发，导致 leave 后触发 focus，而显示 tooltip
    // 所以延迟执行 leave
    this.hoverTimeout = window.setTimeout(() => {
      this.requestClose();
    }, this.closeDelay || 50);
  }

  /**
   * 在 document 上点击时，根据条件判断是否关闭 tooltip
   */
  private onDocumentClick(e: MouseEvent) {
    if (this.disabled || !this.open) {
      return;
    }

    const path = e.composedPath();

    // 点击 tooltip 外部区域，直接关闭
    if (!path.includes(this)) {
      this.requestClose();
    }
  }

  private onWindowScroll() {
    window.requestAnimationFrame(() => this.updatePositioner());
  }

  private updatePositioner(): void {
    const $popup = $(this.popupRef.value!);

    const targetMargin = this.isRich() ? 0 : 4; // 触发目标和 popup 之间的间距
    const popupMargin = 4; // popup 和视口之间的间距

    // 触发目标的位置和宽高
    const targetRect = this.target.getBoundingClientRect();
    const targetTop = targetRect.top;
    const targetLeft = targetRect.left;
    const targetHeight = targetRect.height;
    const targetWidth = targetRect.width;

    // popup 的宽高
    const popupHeight = this.popupRef.value!.offsetHeight;
    const popupWidth = this.popupRef.value!.offsetWidth;

    // popup 在 x 轴和 y 轴占据的空间
    const popupXSpace = popupWidth + targetMargin + popupMargin;
    const popupYSpace = popupHeight + targetMargin + popupMargin;

    let transformOriginX: 'left' | 'right' | 'center';
    let transformOriginY: 'top' | 'bottom' | 'center';
    let top: number;
    let left: number;
    let placement = this.placement;

    // 自动判断 popup 方位
    if (placement === 'auto') {
      const $window = $(window);
      const hasTopSpace = targetTop > popupYSpace;
      const hasBottomSpace =
        $window.height() - targetTop - targetHeight > popupYSpace;
      const hasLeftSpace = targetLeft > popupXSpace;
      const hasRightSpace =
        $window.width() - targetLeft - targetWidth > popupXSpace;

      // rich 优先级为 bottom-right > bottom-left > top-right > top-left >
      //              bottom > top > right > left
      if (this.isRich()) {
        placement = 'bottom-right';

        if (hasBottomSpace && hasRightSpace) {
          placement = 'bottom-right';
        } else if (hasBottomSpace && hasLeftSpace) {
          placement = 'bottom-left';
        } else if (hasTopSpace && hasRightSpace) {
          placement = 'top-right';
        } else if (hasTopSpace && hasLeftSpace) {
          placement = 'top-left';
        } else if (hasBottomSpace) {
          placement = 'bottom';
        } else if (hasTopSpace) {
          placement = 'top';
        } else if (hasRightSpace) {
          placement = 'right';
        } else if (hasLeftSpace) {
          placement = 'left';
        }
      }
      // plain 优先级为 top > bottom > left > right
      else {
        placement = 'top';

        if (hasTopSpace) {
          placement = 'top';
        } else if (hasBottomSpace) {
          placement = 'bottom';
        } else if (hasLeftSpace) {
          placement = 'left';
        } else if (hasRightSpace) {
          placement = 'right';
        }
      }
    }

    // 根据 placement 计算 popup 的位置和方向
    const [position, alignment] = placement.split('-') as [
      'top' | 'bottom' | 'left' | 'right',
      'start' | 'end' | 'left' | 'right' | undefined,
    ];

    switch (position) {
      case 'top':
        transformOriginY = 'bottom';
        top = targetTop - popupHeight - targetMargin;
        break;
      case 'bottom':
        transformOriginY = 'top';
        top = targetTop + targetHeight + targetMargin;
        break;
      default:
        transformOriginY = 'center';
        switch (alignment) {
          case 'start':
            top = targetTop;
            break;
          case 'end':
            top = targetTop + targetHeight - popupHeight;
            break;
          default:
            top = targetTop + targetHeight / 2 - popupHeight / 2;
            break;
        }
        break;
    }

    switch (position) {
      case 'left':
        transformOriginX = 'right';
        left = targetLeft - popupWidth - targetMargin;
        break;
      case 'right':
        transformOriginX = 'left';
        left = targetLeft + targetWidth + targetMargin;
        break;
      default:
        transformOriginX = 'center';
        switch (alignment) {
          case 'start':
            left = targetLeft;
            break;
          case 'end':
            left = targetLeft + targetWidth - popupWidth;
            break;
          case 'left':
            transformOriginX = 'right';
            left = targetLeft - popupWidth - targetMargin;
            break;
          case 'right':
            transformOriginX = 'left';
            left = targetLeft + targetWidth + targetMargin;
            break;
          default:
            left = targetLeft + targetWidth / 2 - popupWidth / 2;
            break;
        }
        break;
    }

    $popup.css({
      top,
      left,
      transformOrigin: [transformOriginX, transformOriginY].join(' '),
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mdui-tooltip': Tooltip;
  }
}
