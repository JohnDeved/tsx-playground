// Dynamic type loader for Monaco editor
// Fetches TypeScript definitions from esm.sh for imported packages

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
      // Extract package name (handle scoped packages and subpaths)
      let packageName: string
      
      if (importPath.startsWith('@')) {
        // Scoped package: @scope/package or @scope/package/subpath
        const parts = importPath.split('/')
        packageName = parts.slice(0, 2).join('/')
      } else {
        // Regular package: package or package/subpath
        packageName = importPath.split('/')[0]
      }
      
      // Map specific imports to their base packages
      if (importPath.startsWith('react-icons/')) {
        packageName = 'react-icons'
      }
      
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
    console.log(`Attempting to fetch types for ${packageName} from esm.sh...`)
    
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
    if (content.includes('declare') || content.includes('export') || content.includes('interface')) {
      console.log(`✅ Successfully loaded types for ${packageName}`)
      return content
    }
    
    return null
  } catch (error) {
    console.warn(`External requests blocked for ${packageName}:`, error.message)
    return null
  }
}

/**
 * Generate minimal type stubs for common packages when external loading fails
 */
function generateMinimalTypeStub(packageName: string): string {
  const stubs: Record<string, string> = {
    'react-icons': `
declare module 'react-icons/*' {
  import { ComponentType } from 'react';
  const icon: ComponentType<any>;
  export = icon;
}

declare module 'react-icons/io5' {
  export const IoSparkles: ComponentType<any>;
  export const IoHome: ComponentType<any>;
  export const IoMenu: ComponentType<any>;
  export const IoClose: ComponentType<any>;
  export const IoSearch: ComponentType<any>;
  export const IoAdd: ComponentType<any>;
  export const IoTrash: ComponentType<any>;
  export const IoEdit: ComponentType<any>;
  export const IoSave: ComponentType<any>;
  export const IoDownload: ComponentType<any>;
  export const IoUpload: ComponentType<any>;
  export const IoRefresh: ComponentType<any>;
  export const IoSettings: ComponentType<any>;
  export const IoHeart: ComponentType<any>;
  export const IoStar: ComponentType<any>;
  export const IoThumbsUp: ComponentType<any>;
  export const IoArrowForward: ComponentType<any>;
  export const IoArrowBack: ComponentType<any>;
  export const IoChevronDown: ComponentType<any>;
  export const IoChevronUp: ComponentType<any>;
  export const IoCheckmark: ComponentType<any>;
}`,
    
    'framer-motion': `
declare module 'framer-motion' {
  import { ComponentType, ReactNode } from 'react';
  
  export interface MotionProps {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    whileHover?: any;
    whileTap?: any;
    whileFocus?: any;
    whileInView?: any;
    drag?: boolean | 'x' | 'y';
    dragConstraints?: any;
    layout?: boolean;
    layoutId?: string;
    className?: string;
    style?: any;
    children?: ReactNode;
    onClick?: () => void;
    onHoverStart?: () => void;
    onHoverEnd?: () => void;
    [key: string]: any;
  }
  
  export const motion: {
    div: ComponentType<MotionProps>;
    span: ComponentType<MotionProps>;
    p: ComponentType<MotionProps>;
    h1: ComponentType<MotionProps>;
    h2: ComponentType<MotionProps>;
    h3: ComponentType<MotionProps>;
    button: ComponentType<MotionProps>;
    a: ComponentType<MotionProps>;
    img: ComponentType<MotionProps>;
    section: ComponentType<MotionProps>;
    article: ComponentType<MotionProps>;
    header: ComponentType<MotionProps>;
    footer: ComponentType<MotionProps>;
    nav: ComponentType<MotionProps>;
    main: ComponentType<MotionProps>;
    aside: ComponentType<MotionProps>;
    [key: string]: ComponentType<MotionProps>;
  };
  
  export const AnimatePresence: ComponentType<{
    children?: ReactNode;
    mode?: 'wait' | 'sync' | 'popLayout';
    initial?: boolean;
    onExitComplete?: () => void;
  }>;
  
  export function useAnimation(): any;
  export function useMotionValue(initial: any): any;
  export function useTransform(value: any, inputRange: number[], outputRange: any[]): any;
  export function useSpring(value: any, config?: any): any;
}`
  }
  
  return stubs[packageName] || `
declare module '${packageName}' {
  const mod: any;
  export = mod;
  export default mod;
}`
}

/**
 * Load types for multiple packages and add them to Monaco
 */
export async function loadTypesForPackages(
  packages: string[], 
  monaco: any,
  loadedTypesRef: Set<string>
): Promise<void> {
  const newPackages = packages.filter(pkg => !loadedTypesRef.has(pkg))
  
  if (newPackages.length === 0) return
  
  console.log('Loading types for packages:', newPackages)
  
  for (const packageName of newPackages) {
    try {
      // First attempt dynamic loading from esm.sh
      let typeDefinitions = await fetchTypeDefinitions(packageName)
      
      // If external loading fails, use minimal type stub
      if (!typeDefinitions) {
        console.log(`📝 Using minimal type stub for ${packageName}`)
        typeDefinitions = generateMinimalTypeStub(packageName)
      }
      
      if (typeDefinitions && monaco?.languages?.typescript?.typescriptDefaults?.addExtraLib) {
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
          typeDefinitions,
          `file:///node_modules/@types/${packageName.replace('@', '').replace('/', '__')}/index.d.ts`
        )
        
        loadedTypesRef.add(packageName)
        console.log(`✅ Loaded types for ${packageName}`)
      }
    } catch (error) {
      console.warn(`❌ Failed to load types for ${packageName}:`, error)
      // Still mark as loaded to avoid retrying
      loadedTypesRef.add(packageName)
    }
  }
}