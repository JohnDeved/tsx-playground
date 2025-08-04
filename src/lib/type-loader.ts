// Dynamic type loader for Monaco editor
// Parses imports from code and fetches type definitions from esm.sh

/**
 * Parse import statements from TypeScript/TSX code
 */
export function parseImports(code: string): string[] {
  const imports = new Set<string>()
  
  // Regex to match import statements
  const importRegex = /import\s+(?:.*?\s+from\s+)?['"`]([^'"`]+)['"`]/g
  let match
  
  while ((match = importRegex.exec(code)) !== null) {
    const importPath = match[1]
    
    // Skip relative imports and built-in modules
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      // Extract package name (handle scoped packages like @react-icons/io5)
      const packageName = importPath.startsWith('@') 
        ? importPath.split('/').slice(0, 2).join('/')
        : importPath.split('/')[0]
      
      imports.add(packageName)
    }
  }
  
  return Array.from(imports)
}

/**
 * Fetch type definitions for a package from esm.sh
 */
export async function fetchTypeDefinitions(packageName: string): Promise<string | null> {
  try {
    // Try to fetch TypeScript definitions from esm.sh
    const response = await fetch(`https://esm.sh/${packageName}?target=es2022&format=esm`, {
      headers: {
        'Accept': 'application/typescript, text/plain'
      }
    })
    
    if (!response.ok) {
      console.warn(`Failed to fetch types for ${packageName}:`, response.status)
      return null
    }
    
    const content = await response.text()
    
    // Check if we got TypeScript definitions
    if (content.includes('declare') || content.includes('export')) {
      return content
    }
    
    // If no types found, try to fetch from @types package
    return await fetchTypesPackage(`@types/${packageName.replace('@', '').replace('/', '__')}`)
  } catch (error) {
    console.warn(`Error fetching types for ${packageName}:`, error)
    return null
  }
}

/**
 * Fetch from @types packages
 */
async function fetchTypesPackage(typesPackageName: string): Promise<string | null> {
  try {
    const response = await fetch(`https://esm.sh/${typesPackageName}?target=es2022&format=esm`)
    
    if (!response.ok) {
      return null
    }
    
    const content = await response.text()
    return content.includes('declare') ? content : null
  } catch {
    return null
  }
}

/**
 * Generate fallback type definitions for common libraries
 */
export function generateFallbackTypes(packageName: string): string {
  const commonLibraries: Record<string, string> = {
    'react': `
declare module 'react' {
  export interface FC<P = {}> {
    (props: P): JSX.Element | null;
  }
  export interface Component<P = {}, S = {}> {
    render(): JSX.Element | null;
  }
  export function useState<T>(initial: T): [T, (value: T) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useRef<T>(initial: T | null): { current: T | null };
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
  export function useMemo<T>(factory: () => T, deps: any[]): T;
  export const Fragment: FC<{ children?: any }>;
}`,
    
    'react-icons': `
declare module 'react-icons' {
  export interface IconBaseProps extends React.SVGAttributes<SVGElement> {
    children?: React.ReactNode;
    size?: string | number;
    color?: string;
    title?: string;
  }
  export type IconType = React.ComponentType<IconBaseProps>;
}`,
    
    'react-icons/io5': `
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
  export const IoGift: IconType;
  export const IoFlash: IconType;
  export const IoFlame: IconType;
  export const IoSunny: IconType;
  export const IoMoon: IconType;
  export const IoCloudyNight: IconType;
  export const IoRainy: IconType;
  export const IoThunderstorm: IconType;
  export const IoSnow: IconType;
  export const IoPartlySunny: IconType;
}`,
    
    'framer-motion': `
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
  
  export const AnimatePresence: React.ComponentType<{
    children?: React.ReactNode;
    mode?: 'wait' | 'sync' | 'popLayout';
    initial?: boolean;
    onExitComplete?: () => void;
  }>;
  
  export function useAnimation(): any;
  export function useMotionValue<T>(initial: T): MotionValue<T>;
  export function useTransform<T>(
    value: MotionValue<number>,
    inputRange: number[],
    outputRange: T[]
  ): MotionValue<T>;
  export function useSpring(source: MotionValue<number>): MotionValue<number>;
  export function useInView(ref: React.RefObject<Element>, options?: any): boolean;
}`,
    
    'lucide-react': `
declare module 'lucide-react' {
  import { IconType } from 'react-icons';
  export const ArrowRight: IconType;
  export const ArrowLeft: IconType;
  export const ArrowUp: IconType;
  export const ArrowDown: IconType;
  export const Check: IconType;
  export const X: IconType;
  export const Plus: IconType;
  export const Minus: IconType;
  export const Search: IconType;
  export const Settings: IconType;
  export const Home: IconType;
  export const User: IconType;
  export const Mail: IconType;
  export const Phone: IconType;
  export const Calendar: IconType;
  export const Clock: IconType;
  export const MapPin: IconType;
  export const Camera: IconType;
  export const Image: IconType;
  export const Video: IconType;
  export const Music: IconType;
  export const Volume: IconType;
  export const VolumeX: IconType;
  export const Play: IconType;
  export const Pause: IconType;
  export const Stop: IconType;
  export const SkipBack: IconType;
  export const SkipForward: IconType;
  export const Repeat: IconType;
  export const Shuffle: IconType;
  export const Heart: IconType;
  export const Star: IconType;
  export const Bookmark: IconType;
  export const Share: IconType;
  export const Download: IconType;
  export const Upload: IconType;
  export const File: IconType;
  export const Folder: IconType;
  export const Edit: IconType;
  export const Save: IconType;
  export const Trash: IconType;
  export const Copy: IconType;
  export const Cut: IconType;
  export const Paste: IconType;
  export const Undo: IconType;
  export const Redo: IconType;
  export const Refresh: IconType;
  export const Globe: IconType;
  export const Wifi: IconType;
  export const Battery: IconType;
  export const Bluetooth: IconType;
  export const Smartphone: IconType;
  export const Tablet: IconType;
  export const Laptop: IconType;
  export const Monitor: IconType;
  export const Printer: IconType;
  export const Mouse: IconType;
  export const Keyboard: IconType;
  export const Headphones: IconType;
  export const Microphone: IconType;
  export const Speaker: IconType;
}`,

    'zustand': `
declare module 'zustand' {
  export interface StateCreator<T, Tmi = {}, Tmo = {}, U = T> {
    (
      setState: (partial: Partial<T> | ((state: T) => Partial<T>), replace?: boolean) => void,
      getState: () => T,
      api: any
    ): U;
  }
  
  export function create<T>(
    createState: StateCreator<T>
  ): () => T & { setState: (partial: Partial<T> | ((state: T) => Partial<T>), replace?: boolean) => void };
}`
  }
  
  // For any unknown package, provide a generic module declaration
  return commonLibraries[packageName] || `
declare module '${packageName}' {
  const _default: any;
  export default _default;
  export * from '${packageName}';
}`
}

/**
 * Type loading cache to avoid refetching
 */
const typeCache = new Map<string, string>()

/**
 * Load types for multiple packages with caching
 */
export async function loadTypesForPackages(packages: string[]): Promise<Record<string, string>> {
  const types: Record<string, string> = {}
  
  for (const packageName of packages) {
    // Check cache first
    if (typeCache.has(packageName)) {
      types[packageName] = typeCache.get(packageName)!
      continue
    }
    
    let typeDefinition: string
    
    try {
      // Try to fetch from esm.sh with a short timeout
      const fetchPromise = fetchTypeDefinitions(packageName)
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 2000)
      )
      
      typeDefinition = await Promise.race([fetchPromise, timeoutPromise]) || generateFallbackTypes(packageName)
    } catch {
      // Always fall back to built-in definitions on any error
      typeDefinition = generateFallbackTypes(packageName)
    }
    
    // Cache the result
    typeCache.set(packageName, typeDefinition)
    types[packageName] = typeDefinition
  }
  
  return types
}