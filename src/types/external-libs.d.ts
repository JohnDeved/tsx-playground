// Type definitions for external libraries used in the Monaco editor

declare module 'react-icons/io5' {
  import { IconType } from 'react-icons';
  export const IoSparkles: IconType;
  export const IoHeart: IconType;
  export const IoStar: IconType;
  export const IoPlay: IconType;
  export const IoPause: IconType;
  export const IoStop: IconType;
  export const IoHome: IconType;
  export const IoSettings: IconType;
  export const IoSearch: IconType;
  export const IoMenu: IconType;
  export const IoClose: IconType;
  export const IoAdd: IconType;
  export const IoRemove: IconType;
  export const IoCheckmark: IconType;
  export const IoArrowBack: IconType;
  export const IoArrowForward: IconType;
  export const IoArrowUp: IconType;
  export const IoArrowDown: IconType;
  export const IoGift: IconType;
  export const IoCode: IconType;
  export const IoDocument: IconType;
  export const IoEye: IconType;
  export const IoDownload: IconType;
  export const IoShare: IconType;
  export const IoTrash: IconType;
  export const IoEdit: IconType;
  export const IoSave: IconType;
  export const IoRefresh: IconType;
  export const IoNotifications: IconType;
  export const IoLogOut: IconType;
  export const IoLogIn: IconType;
  export const IoPerson: IconType;
  export const IoMail: IconType;
  export const IoCall: IconType;
  export const IoLocation: IconType;
  export const IoTime: IconType;
  export const IoCalendar: IconType;
  export const IoCamera: IconType;
  export const IoImage: IconType;
  export const IoFilm: IconType;
  export const IoMusicalNotes: IconType;
  export const IoVolumeMute: IconType;
  export const IoVolumeHigh: IconType;
  export const IoBrush: IconType;
  export const IoColorPalette: IconType;
  export const IoResize: IconType;
  export const IoCrop: IconType;
  export const IoFilters: IconType;
  export const IoLayers: IconType;
}

declare module 'react-icons' {
  export interface IconBaseProps extends React.SVGAttributes<SVGElement> {
    children?: React.ReactNode;
    size?: string | number;
    color?: string;
    title?: string;
  }
  export type IconType = React.ComponentType<IconBaseProps>;
}

declare module 'framer-motion' {
  export interface MotionValue<T = any> {
    get(): T;
    set(v: T): void;
    onChange(callback: (latest: T) => void): () => void;
    destroy(): void;
  }

  export interface Transition {
    delay?: number;
    duration?: number;
    ease?: string | number[];
    times?: number[];
    repeat?: number;
    repeatType?: "loop" | "reverse" | "mirror";
    repeatDelay?: number;
    type?: "tween" | "spring" | "keyframes" | "inertia";
    bounce?: number;
    damping?: number;
    mass?: number;
    stiffness?: number;
    velocity?: number;
    restSpeed?: number;
    restDelta?: number;
  }

  export interface AnimationProps {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: Transition;
    whileHover?: any;
    whileTap?: any;
    whileInView?: any;
    whileFocus?: any;
    whileDrag?: any;
    variants?: any;
    custom?: any;
  }

  export interface MotionProps extends AnimationProps {
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
    layout?: boolean | "position" | "size";
    layoutId?: string;
    drag?: boolean | "x" | "y";
    dragConstraints?: any;
    dragElastic?: number | boolean;
    dragMomentum?: boolean;
    onDrag?: (event: any, info: any) => void;
    onDragStart?: (event: any, info: any) => void;
    onDragEnd?: (event: any, info: any) => void;
  }
  
  export interface MotionComponent {
    (props: MotionProps & React.HTMLAttributes<HTMLElement>): JSX.Element;
  }
  
  export const motion: {
    div: MotionComponent;
    span: MotionComponent;
    h1: MotionComponent;
    h2: MotionComponent;
    h3: MotionComponent;
    h4: MotionComponent;
    h5: MotionComponent;
    h6: MotionComponent;
    p: MotionComponent;
    a: MotionComponent;
    button: MotionComponent;
    img: MotionComponent;
    video: MotionComponent;
    canvas: MotionComponent;
    svg: MotionComponent;
    section: MotionComponent;
    article: MotionComponent;
    header: MotionComponent;
    footer: MotionComponent;
    nav: MotionComponent;
    main: MotionComponent;
    aside: MotionComponent;
    ul: MotionComponent;
    ol: MotionComponent;
    li: MotionComponent;
    form: MotionComponent;
    input: MotionComponent;
    textarea: MotionComponent;
    select: MotionComponent;
    option: MotionComponent;
    label: MotionComponent;
    fieldset: MotionComponent;
    legend: MotionComponent;
    table: MotionComponent;
    caption: MotionComponent;
    thead: MotionComponent;
    tbody: MotionComponent;
    tfoot: MotionComponent;
    tr: MotionComponent;
    th: MotionComponent;
    td: MotionComponent;
    pre: MotionComponent;
    code: MotionComponent;
    blockquote: MotionComponent;
    figure: MotionComponent;
    figcaption: MotionComponent;
  };
  
  export interface AnimatePresenceProps {
    children?: React.ReactNode;
    mode?: 'wait' | 'sync' | 'popLayout';
    initial?: boolean;
    onExitComplete?: () => void;
    exitBeforeEnter?: boolean;
    presenceAffectsLayout?: boolean;
  }
  
  export const AnimatePresence: React.ComponentType<AnimatePresenceProps>;
  
  export function useAnimation(): any;
  export function useMotionValue<T>(initial: T): MotionValue<T>;
  export function useTransform<T>(
    value: MotionValue<number>,
    inputRange: number[],
    outputRange: T[]
  ): MotionValue<T>;
  export function useSpring(source: MotionValue<number>): MotionValue<number>;
  export function useInView(ref: React.RefObject<Element>, options?: any): boolean;
}